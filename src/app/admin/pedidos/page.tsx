"use client"

import { useEffect, useState } from "react"
import { Copy, CheckCircle, DollarSign, Package, Clock, XCircle, Search, X } from "lucide-react"

type Seller = { id: string; name: string; pixKey: string | null }
type OrderItem = {
  quantity: number
  price: number
  listingItem: { product: { name: string }; listing: { seller: Seller } }
}
type Order = {
  id: string
  total: number
  commission: number
  status: "PENDENTE" | "PAGO" | "ENTREGUE" | "CANCELADO"
  sellerPaid: boolean
  createdAt: string
  buyer: { name: string; email: string }
  items: OrderItem[]
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  PENDENTE:  { bg: "rgba(255,214,10,0.12)",  color: "var(--warning)", label: "Pendente",  icon: Clock },
  PAGO:      { bg: "rgba(0,113,227,0.12)",   color: "var(--accent)",  label: "Pago",      icon: DollarSign },
  ENTREGUE:  { bg: "rgba(48,209,88,0.12)",   color: "var(--success)", label: "Entregue",  icon: Package },
  CANCELADO: { bg: "rgba(255,69,58,0.12)",   color: "var(--error)",   label: "Cancelado", icon: XCircle },
}

const STATUS_OPTIONS = ["TODOS", "PENDENTE", "PAGO", "ENTREGUE", "CANCELADO"]

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState("TODOS")
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/pedidos")
    setOrders(await res.json())
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(status)
    const res = await fetch(`/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    setUpdating(null)
    await load()
    setSelected((prev) => prev ? {
      ...prev,
      status: status as Order["status"],
      sellerPaid: data.sellerPaid ?? prev.sellerPaid,
    } : null)

    if (data.pixSent) {
      alert(`✅ PIX de R$ ${(Number(data.total) - Number(data.commission)).toFixed(2)} enviado automaticamente ao vendedor!`)
    } else if (data.pixError) {
      alert(`⚠️ Item entregue, mas o PIX automático falhou: ${JSON.stringify(data.pixError?.message ?? data.pixError)}.\n\nPague o vendedor manualmente.`)
    }
  }

  async function confirmSellerPaid(id: string) {
    setUpdating("pay")
    await fetch(`/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerPaid: true }),
    })
    setUpdating(null)
    await load()
    setSelected((prev) => prev ? { ...prev, sellerPaid: true } : null)
  }

  function getSellerInfo(order: Order) {
    const seller = order.items[0]?.listingItem?.listing?.seller
    if (!seller) return null
    return { seller, sellerAmount: Number(order.total) - Number(order.commission) }
  }

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "TODOS" || o.status === statusFilter
    const matchSearch = !search ||
      o.buyer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer.email.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="relative">
      {/* Header + filtros */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Pedidos
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
            {filtered.length}/{orders.length}
          </span>
        </h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        {/* Busca */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
            placeholder="Buscar por comprador, email ou ID..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ color: "var(--text-tertiary)" }}><X size={13} /></button>}
        </div>

        {/* Filtros de status */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => {
            const count = s === "TODOS" ? orders.length : orders.filter((o) => o.status === s).length
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  background: statusFilter === s ? "var(--accent)" : "var(--surface-1)",
                  color: statusFilter === s ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${statusFilter === s ? "transparent" : "var(--border)"}`,
                }}>
                {s === "TODOS" ? "Todos" : STATUS_STYLE[s]?.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              {["Pedido", "Comprador", "Itens", "Total", "Comissão", "Status", "Data"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Nenhum pedido encontrado</td></tr>
            ) : filtered.map((order, i) => {
              const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.PENDENTE
              const Icon = s.icon
              return (
                <tr key={order.id}
                  onClick={() => setSelected(order)}
                  className="cursor-pointer transition-colors"
                  style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--surface-1)" : "var(--bg)"}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>{order.buyer.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{order.buyer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 font-semibold text-xs" style={{ color: "var(--text-primary)" }}>
                    R$ {Number(order.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--success)" }}>
                    R$ {Number(order.commission).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit font-medium"
                      style={{ background: s.bg, color: s.color }}>
                      <Icon size={10} />
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer lateral de detalhes */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSelected(null)} />
          <aside className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{ width: "min(480px,100vw)", background: "var(--surface-1)", borderLeft: "1px solid var(--border)" }}>

            {/* Header do drawer */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  #{selected.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(selected.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <X size={17} />
              </button>
            </div>

            <div className="flex flex-col gap-5 p-6">
              {/* Status */}
              {(() => {
                const s = STATUS_STYLE[selected.status] ?? STATUS_STYLE.PENDENTE
                const Icon = s.icon
                return (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium w-fit"
                    style={{ background: s.bg, color: s.color }}>
                    <Icon size={14} />
                    {s.label}
                    {selected.status === "ENTREGUE" && (
                      <span className="ml-1 text-xs opacity-70">
                        · {selected.sellerPaid ? "Vendedor pago" : "Vendedor não pago"}
                      </span>
                    )}
                  </div>
                )
              })()}

              {/* Comprador / Vendedor */}
              <div className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Comprador</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selected.buyer.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{selected.buyer.email}</p>
                </div>
                {(() => {
                  const seller = selected.items[0]?.listingItem?.listing?.seller
                  return seller ? (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                      <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Vendedor</p>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{seller.name}</p>
                    </div>
                  ) : null
                })()}
              </div>

              {/* Itens */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>ITENS</p>
                <div className="flex flex-col gap-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm"
                      style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                      <span style={{ color: "var(--text-primary)" }}>
                        {item.listingItem?.product?.name ?? "Item"} <span style={{ color: "var(--text-tertiary)" }}>x{item.quantity}</span>
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold pt-1">
                    <span style={{ color: "var(--text-secondary)" }}>Total</span>
                    <span style={{ color: "var(--text-primary)" }}>R$ {Number(selected.total).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-tertiary)" }}>Comissão da plataforma (10%)</span>
                    <span style={{ color: "var(--success)" }}>R$ {Number(selected.commission).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ── PAGO: entregar item ── */}
              {selected.status === "PAGO" && (
                <div className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <Package size={14} style={{ color: "var(--accent)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      Entregue o item ao comprador in-game
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Após entregar para <strong>{selected.buyer.name}</strong> no jogo, confirme abaixo.
                  </p>
                  <button onClick={() => updateStatus(selected.id, "ENTREGUE")}
                    disabled={updating === "ENTREGUE"}
                    className="text-xs px-4 py-1.5 rounded-full font-medium transition-colors w-fit"
                    style={{ background: "var(--surface-2)", color: "var(--accent)", border: "1px solid rgba(0,113,227,0.3)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,113,227,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-2)"}>
                    {updating === "ENTREGUE" ? "Registrando..." : "Marcar como entregue"}
                  </button>
                </div>
              )}

              {/* ── ENTREGUE: pagar vendedor ── */}
              {selected.status === "ENTREGUE" && !selected.sellerPaid && (() => {
                const sellerInfo = getSellerInfo(selected)
                if (!sellerInfo) return null
                return (
                  <div className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: "rgba(255,214,10,0.06)", border: "1px solid rgba(255,214,10,0.2)" }}>
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} style={{ color: "var(--warning)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--warning)" }}>Envie o PIX ao vendedor</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>Valor a transferir</span>
                      <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        R$ {sellerInfo.sellerAmount.toFixed(2)}
                      </span>
                    </div>
                    {sellerInfo.seller.pixKey ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Chave PIX</p>
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {sellerInfo.seller.pixKey}
                          </p>
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(sellerInfo.seller.pixKey!); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                          style={{ background: copied ? "var(--success)" : "var(--accent)", color: "#fff" }}>
                          {copied ? <><CheckCircle size={11} className="inline mr-1" />Copiado</> : <><Copy size={11} className="inline mr-1" />Copiar</>}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "var(--error)" }}>Vendedor sem chave PIX cadastrada</p>
                    )}
                    <button onClick={() => confirmSellerPaid(selected.id)} disabled={updating === "pay"}
                      className="btn-primary text-sm">
                      <CheckCircle size={14} />
                      {updating === "pay" ? "Confirmando..." : "Confirmar PIX enviado"}
                    </button>
                  </div>
                )
              })()}

              {/* ── ENTREGUE + pago ── */}
              {selected.status === "ENTREGUE" && selected.sellerPaid && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(48,209,88,0.08)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.2)" }}>
                  <CheckCircle size={14} />
                  Pedido concluído e vendedor pago
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
