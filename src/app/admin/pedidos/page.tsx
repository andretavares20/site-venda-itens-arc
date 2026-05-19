"use client"

import { useEffect, useState } from "react"
import { Copy, CheckCircle, DollarSign, Package, Clock, XCircle } from "lucide-react"

type Seller = { id: string; name: string; pixKey: string | null }

type ListingItem = {
  id: string
  quantity: number
  price: number
  product: { name: string }
  listing: { seller: Seller }
}

type OrderItem = {
  listingItem: ListingItem
  quantity: number
  price: number
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

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  PENDENTE:  { bg: "rgba(255,214,10,0.1)",  color: "var(--warning)", label: "Aguardando pagamento" },
  PAGO:      { bg: "rgba(0,113,227,0.1)",   color: "var(--accent)",  label: "Pago — entregar item" },
  ENTREGUE:  { bg: "rgba(48,209,88,0.1)",   color: "var(--success)", label: "Entregue" },
  CANCELADO: { bg: "rgba(255,69,58,0.1)",   color: "var(--error)",   label: "Cancelado" },
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/pedidos")
    setOrders(await res.json())
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    load()
  }

  async function confirmSellerPaid(id: string) {
    setUpdating(id + "-pay")
    await fetch(`/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerPaid: true }),
    })
    setUpdating(null)
    load()
  }

  function copyPixKey(key: string, orderId: string) {
    navigator.clipboard.writeText(key)
    setCopied(orderId)
    setTimeout(() => setCopied(null), 3000)
  }

  function getSellerInfo(order: Order) {
    const seller = order.items[0]?.listingItem?.listing?.seller
    if (!seller) return null
    return { seller, sellerAmount: Number(order.total) - Number(order.commission) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Pedidos</h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => {
          const style = statusStyle[order.status] ?? statusStyle.PENDENTE
          const sellerInfo = getSellerInfo(order)

          return (
            <div key={order.id} className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>

              {/* Header */}
              <div className="flex items-start justify-between gap-4 flex-wrap p-5">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                    {order.status === "ENTREGUE" && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: order.sellerPaid ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)",
                          color: order.sellerPaid ? "var(--success)" : "var(--error)",
                        }}>
                        {order.sellerPaid ? "Vendedor pago ✓" : "Vendedor não pago"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Comprador: {order.buyer.name} · {order.buyer.email}
                  </p>
                  {sellerInfo && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      Vendedor: {sellerInfo.seller.name}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(order.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                    R$ {Number(order.total).toFixed(2)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--success)" }}>
                    Comissão: R$ {Number(order.commission).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Itens */}
              <div className="flex flex-wrap gap-2 px-5 pb-4">
                {order.items.map((item, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    {item.listingItem?.product?.name ?? "Item"} x{item.quantity}
                  </span>
                ))}
              </div>

              {/* ── PAGO: botão de entrega ── */}
              {order.status === "PAGO" && (
                <div className="mx-5 mb-5 rounded-xl p-4"
                  style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={15} style={{ color: "var(--accent)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      Pagamento confirmado — entregue o item ao comprador in-game
                    </span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                    Após entregar o item para <strong>{order.buyer.name}</strong> no jogo, clique no botão abaixo.
                  </p>
                  <button
                    onClick={() => updateStatus(order.id, "ENTREGUE")}
                    disabled={updating === order.id}
                    className="btn-primary w-full text-sm"
                  >
                    <CheckCircle size={15} />
                    {updating === order.id ? "Registrando..." : "Item entregue — liberar pagamento ao vendedor"}
                  </button>
                </div>
              )}

              {/* ── ENTREGUE: bloco do PIX ao vendedor ── */}
              {order.status === "ENTREGUE" && !order.sellerPaid && sellerInfo && (
                <div className="mx-5 mb-5 rounded-xl p-4"
                  style={{ background: "rgba(255,214,10,0.06)", border: "1px solid rgba(255,214,10,0.2)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={15} style={{ color: "var(--warning)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
                      Envie o PIX ao vendedor
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>Valor a transferir</span>
                      <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                        R$ {sellerInfo.sellerAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>Comissão retida (10%)</span>
                      <span style={{ color: "var(--success)" }}>
                        R$ {Number(order.commission).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {sellerInfo.seller.pixKey ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl mb-3"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Chave PIX do vendedor</p>
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {sellerInfo.seller.pixKey}
                        </p>
                      </div>
                      <button
                        onClick={() => copyPixKey(sellerInfo.seller.pixKey!, order.id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                        style={{ background: copied === order.id ? "var(--success)" : "var(--accent)", color: "#fff" }}
                      >
                        {copied === order.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                        {copied === order.id ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl mb-3 text-sm"
                      style={{ background: "rgba(255,69,58,0.08)", color: "var(--error)", border: "1px solid rgba(255,69,58,0.2)" }}>
                      Vendedor não cadastrou chave PIX — entre em contato diretamente
                    </div>
                  )}

                  <button
                    onClick={() => confirmSellerPaid(order.id)}
                    disabled={updating === order.id + "-pay"}
                    className="btn-primary w-full text-sm"
                  >
                    <CheckCircle size={15} />
                    {updating === order.id + "-pay" ? "Confirmando..." : "PIX enviado — confirmar pagamento ao vendedor"}
                  </button>
                </div>
              )}

              {/* ── ENTREGUE + pago: confirmação final ── */}
              {order.status === "ENTREGUE" && order.sellerPaid && sellerInfo && (
                <div className="mx-5 mb-5 flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(48,209,88,0.08)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.2)" }}>
                  <CheckCircle size={14} />
                  Concluído — R$ {sellerInfo.sellerAmount.toFixed(2)} enviado para {sellerInfo.seller.name}
                </div>
              )}

              {/* ── PENDENTE: aguardando pagamento ── */}
              {order.status === "PENDENTE" && (
                <div className="mx-5 mb-5 flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(255,214,10,0.06)", color: "var(--warning)", border: "1px solid rgba(255,214,10,0.2)" }}>
                  <Clock size={14} />
                  Aguardando o comprador realizar o pagamento PIX
                </div>
              )}

              {/* ── CANCELADO ── */}
              {order.status === "CANCELADO" && (
                <div className="mx-5 mb-5 flex items-center gap-2 p-3 rounded-xl text-sm"
                  style={{ background: "rgba(255,69,58,0.06)", color: "var(--error)", border: "1px solid rgba(255,69,58,0.2)" }}>
                  <XCircle size={14} />
                  Pedido cancelado
                </div>
              )}
            </div>
          )
        })}

        {orders.length === 0 && (
          <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
            Nenhum pedido ainda
          </div>
        )}
      </div>
    </div>
  )
}
