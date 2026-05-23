"use client"

import { useEffect, useState } from "react"
import { Copy, CheckCircle, DollarSign, Package, Clock, XCircle, Search, X, Send } from "lucide-react"

type Seller = { id: string; name: string; pixKey: string | null }
type OrderItem = {
  quantity: number
  price: number
  stock: { product: { name: string }; seller: Seller }
}
type Order = {
  id: string
  total: number
  commission: number
  status: "PENDENTE" | "PAGO" | "ENTREGUE" | "CANCELADO"
  sellerPaid: boolean
  riderPaid: boolean
  couponCode: string | null
  couponDiscount: number | null
  riderCommission: number | null
  deliveredAt: string | null
  createdAt: string
  buyer: { name: string; email: string }
  items: OrderItem[]
  rider: { name: string; pixKey: string | null } | null
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  PENDENTE:  { bg: "rgba(255,214,10,0.1)",  color: "var(--warning)", label: "Aguardando pagamento", icon: Clock },
  PAGO:      { bg: "rgba(0,113,227,0.1)",   color: "var(--accent)",  label: "Pago — entregar item",  icon: DollarSign },
  ENTREGUE:  { bg: "rgba(48,209,88,0.1)",   color: "var(--success)", label: "Entregue",              icon: Package },
  CANCELADO: { bg: "rgba(255,69,58,0.1)",   color: "var(--error)",   label: "Cancelado",             icon: XCircle },
}

const STATUS_OPTIONS = ["TODOS", "PENDENTE", "PAGO", "ENTREGUE", "CANCELADO"]

type PayModal = { orderId: string; sellerName: string; pixKey: string; amount: number }

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState("TODOS")
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [copied, setCopied] = useState<"key" | "amount" | null>(null)
  const [payModal, setPayModal] = useState<PayModal | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [riderModal, setRiderModal] = useState<PayModal | null>(null)
  const [confirmingRider, setConfirmingRider] = useState(false)
  const [riderQrCode, setRiderQrCode] = useState<string | null>(null)
  const [loadingRiderQr, setLoadingRiderQr] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/pedidos")
    setOrders(await res.json())
    setLoading(false)
  }

  function getSellerInfo(order: Order) {
    const seller = order.items[0]?.stock?.seller
    if (!seller) return null
    const grossTotal = Number(order.total) + Number(order.couponDiscount ?? 0)
    const sellerAmount = grossTotal * 0.9
    return { seller, sellerAmount }
  }

  async function markEntregue(order: Order) {
    setUpdating("ENTREGUE")
    await fetch(`/api/pedidos/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ENTREGUE" }),
    })
    setUpdating(null)
    await load()
    setSelected((prev) => prev ? { ...prev, status: "ENTREGUE" } : null)

    // Abre modal de pagamento imediatamente
    const info = getSellerInfo(order)
    if (info?.seller.pixKey) {
      const modal = {
        orderId: order.id,
        sellerName: info.seller.name,
        pixKey: info.seller.pixKey,
        amount: info.sellerAmount,
      }
      setPayModal(modal)
      loadQrCode(modal)
    }
  }

  async function loadQrCode(modal: PayModal) {
    setLoadingQr(true)
    setQrCode(null)
    const res = await fetch("/api/pix-qrcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pixKey: modal.pixKey, amount: modal.amount, name: modal.sellerName }),
    })
    const data = await res.json()
    setQrCode(data.qrCode)
    setLoadingQr(false)
  }

  async function loadRiderQrCode(modal: PayModal) {
    setLoadingRiderQr(true)
    setRiderQrCode(null)
    const res = await fetch("/api/pix-qrcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pixKey: modal.pixKey, amount: modal.amount, name: modal.sellerName }),
    })
    const data = await res.json()
    setRiderQrCode(data.qrCode)
    setLoadingRiderQr(false)
  }

  function openRiderModal(order: Order) {
    if (!order.rider?.pixKey || !order.riderCommission) return
    const modal: PayModal = {
      orderId: order.id,
      sellerName: order.rider.name,
      pixKey: order.rider.pixKey,
      amount: Number(order.riderCommission),
    }
    setRiderModal(modal)
    loadRiderQrCode(modal)
  }

  async function confirmRiderPayment() {
    if (!riderModal) return
    setConfirmingRider(true)
    await fetch(`/api/pedidos/${riderModal.orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riderPaid: true }),
    })
    setConfirmingRider(false)
    setRiderModal(null)
    setRiderQrCode(null)
    await load()
    setSelected((prev) => prev ? { ...prev, riderPaid: true } : null)
  }

  async function confirmPayment() {
    if (!payModal) return
    setConfirming(true)
    await fetch(`/api/pedidos/${payModal.orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerPaid: true }),
    })
    setConfirming(false)
    setPayModal(null)
    setQrCode(null)
    setCopied(null)
    await load()
    setSelected((prev) => prev ? { ...prev, sellerPaid: true } : null)
  }

  function copy(text: string, type: "key" | "amount") {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Pedidos
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
            {filtered.length}/{orders.length}
          </span>
        </h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }}
            placeholder="Buscar por comprador, email ou ID..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ color: "var(--text-tertiary)" }}><X size={13} /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => {
            const count = s === "TODOS" ? orders.length : orders.filter((o) => o.status === s).length
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: statusFilter === s ? "var(--accent)" : "var(--surface-1)",
                  color: statusFilter === s ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${statusFilter === s ? "transparent" : "var(--border)"}`,
                }}>
                {s === "TODOS" ? "Todos" : STATUS_STYLE[s]?.label.split("—")[0].trim()} ({count})
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
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Nenhum pedido</td></tr>
            ) : filtered.map((order, i) => {
              const s = STATUS_STYLE[order.status] ?? STATUS_STYLE.PENDENTE
              const Icon = s.icon
              return (
                <tr key={order.id} onClick={() => setSelected(order)} className="cursor-pointer transition-colors"
                  style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--surface-1)" : "var(--bg)"}>
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
                      <Icon size={10} />{s.label.split("—")[0].trim()}
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

      {/* Drawer lateral */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)} />
          <aside className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{ width: "min(480px,100vw)", background: "var(--surface-1)", borderLeft: "1px solid var(--border)" }}>
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
                className="w-8 h-8 flex items-center justify-center rounded-full"
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
                    <Icon size={14} />{s.label}
                    {selected.status === "ENTREGUE" && (
                      <span className="ml-1 text-xs opacity-70">
                        · {selected.sellerPaid ? "Vendedor pago ✓" : "Pendente pagamento"}
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
                  const seller = selected.items[0]?.stock?.seller
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
                        {item.stock?.product?.name ?? "Item"}{" "}
                        <span style={{ color: "var(--text-tertiary)" }}>x{item.quantity}</span>
                      </span>
                      <span style={{ color: "var(--text-primary)" }}>R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-semibold pt-1">
                    <span style={{ color: "var(--text-secondary)" }}>Total</span>
                    <span style={{ color: "var(--text-primary)" }}>R$ {Number(selected.total).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-tertiary)" }}>Comissão DropBay</span>
                    <span style={{ color: "var(--success)" }}>+ R$ {Number(selected.commission).toFixed(2)}</span>
                  </div>
                  {selected.couponCode && (
                    <>
                      <div className="flex items-center justify-between text-xs pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        <span style={{ color: "var(--text-tertiary)" }}>Cupom</span>
                        <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{selected.couponCode}</span>
                      </div>
                      {selected.couponDiscount != null && Number(selected.couponDiscount) > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--text-tertiary)" }}>Desconto comprador</span>
                          <span style={{ color: "var(--warning)" }}>-R$ {Number(selected.couponDiscount).toFixed(2)}</span>
                        </div>
                      )}
                      {selected.riderCommission != null && Number(selected.riderCommission) > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--text-tertiary)" }}>Comissão rider</span>
                          <span style={{ color: "var(--error)" }}>R$ {Number(selected.riderCommission).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* PAGO: entregar */}
              {selected.status === "PAGO" && (
                <div className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <Package size={14} style={{ color: "var(--accent)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      Entregue o item ao comprador in-game
                    </span>
                  </div>
                  <button onClick={() => markEntregue(selected)} disabled={updating === "ENTREGUE"}
                    className="text-xs px-4 py-1.5 rounded-full font-medium w-fit transition-colors"
                    style={{ background: "var(--surface-2)", color: "var(--accent)", border: "1px solid rgba(0,113,227,0.3)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,113,227,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-2)"}>
                    {updating === "ENTREGUE" ? "Registrando..." : "Marcar como entregue"}
                  </button>
                </div>
              )}

              {/* ENTREGUE + vendedor pago */}
              {selected.status === "ENTREGUE" && selected.sellerPaid && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{ background: "rgba(48,209,88,0.08)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.2)" }}>
                    <CheckCircle size={14} />
                    Vendedor pago ✓
                  </div>
                  {/* Pagamento ao rider pendente */}
                  {selected.riderCommission != null && Number(selected.riderCommission) > 0 && !selected.riderPaid && (
                    <div className="rounded-xl p-4 flex flex-col gap-2"
                      style={{ background: "rgba(191,90,242,0.06)", border: "1px solid rgba(191,90,242,0.2)" }}>
                      <p className="text-xs font-semibold" style={{ color: "#bf5af2" }}>
                        ⚡ Comissão do rider pendente · R$ {Number(selected.riderCommission).toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        Cupom: {selected.couponCode} · {selected.rider?.name ?? "Rider"}
                      </p>
                      <button
                        onClick={() => openRiderModal(selected)}
                        disabled={!selected.rider?.pixKey}
                        className="text-xs px-3 py-1.5 rounded-full font-medium w-fit"
                        style={{ background: "rgba(191,90,242,0.1)", color: "#bf5af2", border: "1px solid rgba(191,90,242,0.3)" }}>
                        <Send size={12} style={{ display: "inline", marginRight: 4 }} />
                        {selected.rider?.pixKey ? "Pagar rider agora" : "Rider sem chave PIX"}
                      </button>
                    </div>
                  )}
                  {selected.riderCommission != null && Number(selected.riderCommission) > 0 && selected.riderPaid && (
                    <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                      style={{ background: "rgba(191,90,242,0.06)", color: "#bf5af2", border: "1px solid rgba(191,90,242,0.2)" }}>
                      <CheckCircle size={12} /> Comissão do rider paga ✓
                    </div>
                  )}
                </div>
              )}

              {/* ENTREGUE + vendedor não pago */}
              {selected.status === "ENTREGUE" && !selected.sellerPaid && (() => {
                const info = getSellerInfo(selected)
                if (!info) return null
                return (
                  <div className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: "rgba(255,214,10,0.06)", border: "1px solid rgba(255,214,10,0.2)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--warning)" }}>
                      Pagamento ao vendedor pendente
                    </p>
                    <button onClick={() => setPayModal({
                      orderId: selected.id,
                      sellerName: info.seller.name,
                      pixKey: info.seller.pixKey ?? "",
                      amount: info.sellerAmount,
                    })} className="btn-primary text-sm">
                      <Send size={14} /> Pagar vendedor agora
                    </button>
                  </div>
                )
              })()}
            </div>
          </aside>
        </>
      )}

      {/* Modal de pagamento ao vendedor */}
      {payModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(48,209,88,0.1)" }}>
                <Send size={24} style={{ color: "var(--success)" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Envie para {payModal.sellerName}
              </p>
              <p className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                R$ {payModal.amount.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-2xl" style={{ background: "#fff" }}>
                {loadingQr ? (
                  <div className="w-[250px] h-[250px] flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 animate-spin"
                      style={{ borderColor: "#eee", borderTopColor: "#000" }} />
                  </div>
                ) : qrCode ? (
                  <img src={qrCode} alt="QR Code PIX" width={250} height={250} />
                ) : null}
              </div>
              <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
                Abra o <strong>Mercado Pago</strong> → PIX → Escanear
              </p>
            </div>

            {/* Chave PIX com cópia (alternativa) */}
            <div>
              <p className="text-xs mb-1.5 text-center" style={{ color: "var(--text-tertiary)" }}>
                Ou copie a chave PIX manualmente
              </p>
              <button onClick={() => copy(payModal.pixKey, "key")}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                style={{ background: "var(--surface-2)", border: `1px solid ${copied === "key" ? "var(--success)" : "var(--border)"}` }}>
                <span className="text-xs truncate mr-2" style={{ color: "var(--text-primary)" }}>
                  {payModal.pixKey}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
                  style={{ color: copied === "key" ? "var(--success)" : "var(--accent)" }}>
                  {copied === "key" ? <><CheckCircle size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                </span>
              </button>
            </div>

            {/* Botão confirmar */}
            <button onClick={confirmPayment} disabled={confirming} className="btn-primary w-full">
              <CheckCircle size={16} />
              {confirming ? "Confirmando..." : "Já enviei o pagamento ✓"}
            </button>

            <button onClick={() => setPayModal(null)}
              className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
              Fechar e pagar depois
            </button>
          </div>
        </div>
      )}

      {/* Modal de pagamento ao rider */}
      {riderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(191,90,242,0.1)" }}>
                <Send size={24} style={{ color: "#bf5af2" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Comissão para {riderModal.sellerName}
              </p>
              <p className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                R$ {riderModal.amount.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-2xl" style={{ background: "#fff" }}>
                {loadingRiderQr ? (
                  <div className="w-[250px] h-[250px] flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 animate-spin"
                      style={{ borderColor: "#eee", borderTopColor: "#000" }} />
                  </div>
                ) : riderQrCode ? (
                  <img src={riderQrCode} alt="QR Code PIX Rider" width={250} height={250} />
                ) : null}
              </div>
              <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
                Abra o <strong>Mercado Pago</strong> → PIX → Escanear
              </p>
            </div>

            {/* Chave PIX */}
            <div>
              <p className="text-xs mb-1.5 text-center" style={{ color: "var(--text-tertiary)" }}>
                Ou copie a chave PIX manualmente
              </p>
              <button onClick={() => copy(riderModal.pixKey, "key")}
                className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                style={{ background: "var(--surface-2)", border: `1px solid ${copied === "key" ? "var(--success)" : "var(--border)"}` }}>
                <span className="text-xs truncate mr-2" style={{ color: "var(--text-primary)" }}>
                  {riderModal.pixKey}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
                  style={{ color: copied === "key" ? "var(--success)" : "#bf5af2" }}>
                  {copied === "key" ? <><CheckCircle size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                </span>
              </button>
            </div>

            <button onClick={confirmRiderPayment} disabled={confirmingRider} className="btn-primary w-full"
              style={{ background: "#bf5af2" }}>
              <CheckCircle size={16} />
              {confirmingRider ? "Confirmando..." : "Já enviei o pagamento ✓"}
            </button>

            <button onClick={() => setRiderModal(null)}
              className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
              Fechar e pagar depois
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
