"use client"

import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import { AlertTriangle, CheckCircle, Clock, Package, Star, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type OrderItem = {
  quantity: number
  price: number
  stock: { product: { name: string; image: string } } | null
}

type Complaint = { id: string; status: string }
type Review = { id: string }

type SaleOrder = {
  id: string
  total: number
  status: "PAGO" | "ENTREGUE" | "CANCELADO" | "COM_RECLAMACAO"
  sellerDelivered: boolean
  buyerReceived: boolean
  sellerPaid: boolean
  createdAt: string
  buyer: { id: string; name: string; email: string }
  items: OrderItem[]
  complaints: Complaint[]
  reviews: Review[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PAGO:           { label: "Pago — entregar item",  color: "var(--accent)",   icon: Package },
  ENTREGUE:       { label: "Entregue",               color: "var(--success)",  icon: CheckCircle },
  CANCELADO:      { label: "Cancelado",              color: "var(--error)",    icon: XCircle },
  COM_RECLAMACAO: { label: "Com reclamação",         color: "var(--warning)",  icon: AlertTriangle },
}

export default function MinhasVendas() {
  const router = useRouter()
  const [orders, setOrders] = useState<SaleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SaleOrder | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [showComplaint, setShowComplaint] = useState(false)
  const [complaintDesc, setComplaintDesc] = useState("")
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/vendas")
    setOrders(await res.json())
    setLoading(false)
  }

  async function markDelivered(orderId: string) {
    setLoadingAction("deliver")
    const res = await fetch(`/api/pedidos/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "entregar" }),
    })
    setLoadingAction(null)
    if (res.ok) {
      await load()
      setSelected((prev) => prev ? { ...prev, sellerDelivered: true } : null)
    } else {
      const data = await res.json()
      setError(data.error ?? "Erro")
    }
  }

  async function openComplaint(orderId: string) {
    if (!complaintDesc.trim()) { setError("Descreva o problema"); return }
    setLoadingAction("complaint")
    const res = await fetch("/api/reclamacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, role: "VENDEDOR", description: complaintDesc }),
    })
    setLoadingAction(null)
    if (res.ok) {
      setShowComplaint(false)
      setComplaintDesc("")
      await load()
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Erro ao abrir reclamação")
    }
  }

  async function submitReview(order: SaleOrder) {
    setLoadingAction("review")
    const res = await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        receiverId: order.buyer.id,
        rating,
        comment,
        type: "VENDEDOR_PARA_COMPRADOR",
      }),
    })
    setLoadingAction(null)
    if (res.ok) {
      setShowReview(false)
      setComment("")
      setRating(5)
      await load()
    } else {
      const data = await res.json()
      setError(data.error ?? "Erro ao enviar avaliação")
    }
  }

  function selectOrder(order: SaleOrder) {
    setSelected(order)
    setShowComplaint(false)
    setShowReview(false)
    setError("")
    setComplaintDesc("")
    setComment("")
    setRating(5)
  }

  const itemName = (order: SaleOrder) => order.items[0]?.stock?.product?.name ?? "Item"

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Minhas Vendas</h1>

        {loading ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Carregando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} style={{ color: "var(--text-tertiary)", margin: "0 auto 12px" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nenhuma venda ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const s = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PAGO
              const Icon = s.icon
              return (
                <button key={order.id} onClick={() => selectOrder(order)}
                  className="text-left rounded-2xl p-4 transition-colors"
                  style={{ background: "var(--surface-1)", border: `1px solid ${selected?.id === order.id ? "var(--accent)" : "var(--border)"}` }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {itemName(order)}
                        {order.items.length > 1 && <span style={{ color: "var(--text-tertiary)" }}> +{order.items.length - 1}</span>}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        Comprador: {order.buyer.name} · #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        R$ {Number(order.total).toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${s.color}18`, color: s.color }}>
                        <Icon size={10} />{s.label}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>

      {/* Drawer lateral */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)} />
          <aside className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{ width: "min(440px,100vw)", background: "var(--surface-1)", borderLeft: "1px solid var(--border)" }}>

            <div className="flex items-center justify-between px-5 py-4 sticky top-0"
              style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  #{selected.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(selected.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs px-3 py-1.5 rounded-lg"
                style={{ color: "var(--text-secondary)", background: "var(--surface-2)" }}>
                Fechar
              </button>
            </div>

            <div className="flex flex-col gap-5 p-5">
              {error && (
                <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)" }}>
                  {error}
                </p>
              )}

              {/* Comprador */}
              <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Comprador</p>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selected.buyer.name}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{selected.buyer.email}</p>
              </div>

              {/* Itens */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>ITENS VENDIDOS</p>
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-2"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-primary)" }}>
                      {item.stock?.product?.name ?? "Item"} <span style={{ color: "var(--text-tertiary)" }}>x{item.quantity}</span>
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2">
                  <span style={{ color: "var(--text-secondary)" }}>Total</span>
                  <span style={{ color: "var(--text-primary)" }}>R$ {Number(selected.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Status da entrega */}
              {selected.status === "PAGO" && (
                <div className="flex flex-col gap-3 rounded-xl p-4"
                  style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.2)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Entregue o item ao comprador in-game</p>

                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: selected.sellerDelivered ? "var(--success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                        {selected.sellerDelivered && <CheckCircle size={10} color="#fff" />}
                      </div>
                      <span style={{ color: selected.sellerDelivered ? "var(--success)" : "var(--text-secondary)" }}>
                        {selected.sellerDelivered ? "Você marcou como entregue" : "Você ainda não marcou como entregue"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: selected.buyerReceived ? "var(--success)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                        {selected.buyerReceived && <CheckCircle size={10} color="#fff" />}
                      </div>
                      <span style={{ color: selected.buyerReceived ? "var(--success)" : "var(--text-secondary)" }}>
                        {selected.buyerReceived ? "Comprador confirmou o recebimento" : "Aguardando confirmação do comprador"}
                      </span>
                    </div>
                  </div>

                  {!selected.sellerDelivered && (
                    <button onClick={() => markDelivered(selected.id)} disabled={loadingAction === "deliver"}
                      className="text-sm px-4 py-2 rounded-xl font-medium disabled:opacity-60"
                      style={{ background: "var(--accent)", color: "#fff" }}>
                      {loadingAction === "deliver" ? "Marcando..." : "Marcar como entregue"}
                    </button>
                  )}
                </div>
              )}

              {/* Entregue */}
              {selected.status === "ENTREGUE" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ background: "rgba(48,209,88,0.08)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.2)" }}>
                  <CheckCircle size={14} />
                  {selected.sellerPaid ? "Pagamento recebido ✓" : "Entregue — aguardando pagamento"}
                </div>
              )}

              {/* Avaliação do comprador */}
              {selected.status === "ENTREGUE" && selected.reviews.length === 0 && (
                <>
                  {!showReview ? (
                    <button onClick={() => setShowReview(true)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(255,214,10,0.1)", color: "#b8860b", border: "1px solid rgba(255,214,10,0.3)" }}>
                      <Star size={14} />
                      Avaliar comprador
                    </button>
                  ) : (
                    <div className="rounded-xl p-4 flex flex-col gap-3"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Avaliar comprador</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setRating(s)}>
                            <Star size={24} fill={s <= rating ? "#FFD60A" : "transparent"} style={{ color: "#FFD60A" }} />
                          </button>
                        ))}
                      </div>
                      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                        placeholder="Comentário opcional..." rows={3}
                        className="w-full text-sm p-3 rounded-xl resize-none outline-none"
                        style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                      <div className="flex gap-2">
                        <button onClick={() => setShowReview(false)} className="flex-1 py-2 rounded-xl text-sm"
                          style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}>
                          Cancelar
                        </button>
                        <button onClick={() => submitReview(selected)} disabled={loadingAction === "review"}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                          style={{ background: "#FFD60A", color: "#000" }}>
                          {loadingAction === "review" ? "Enviando..." : "Enviar"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selected.status === "ENTREGUE" && selected.reviews.length > 0 && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,214,10,0.08)", color: "#b8860b", border: "1px solid rgba(255,214,10,0.2)" }}>
                  <Star size={12} />
                  Comprador avaliado
                </div>
              )}

              {/* Reclamação */}
              {selected.status === "PAGO" && selected.complaints.length === 0 && (
                <>
                  {!showComplaint ? (
                    <button onClick={() => setShowComplaint(true)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: "var(--surface-1)", color: "var(--warning)", border: "1px solid rgba(255,214,10,0.3)" }}>
                      <AlertTriangle size={14} />
                      Tive um problema — abrir reclamação
                    </button>
                  ) : (
                    <div className="rounded-xl p-4 flex flex-col gap-3"
                      style={{ background: "var(--surface-1)", border: "1px solid rgba(255,214,10,0.3)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>Descreva o problema</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        Ex: comprador não responde, levou mais itens do que deveria in-game, etc.
                      </p>
                      <textarea value={complaintDesc} onChange={(e) => setComplaintDesc(e.target.value)}
                        placeholder="Descreva o que aconteceu..." rows={4}
                        className="w-full text-sm p-3 rounded-xl resize-none outline-none"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                      <div className="flex gap-2">
                        <button onClick={() => { setShowComplaint(false); setError("") }}
                          className="flex-1 py-2 rounded-xl text-sm"
                          style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                          Cancelar
                        </button>
                        <button onClick={() => openComplaint(selected.id)} disabled={loadingAction === "complaint"}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                          style={{ background: "var(--warning)", color: "#000" }}>
                          {loadingAction === "complaint" ? "Enviando..." : "Enviar reclamação"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selected.complaints.length > 0 && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,214,10,0.08)", color: "var(--warning)", border: "1px solid rgba(255,214,10,0.2)" }}>
                  <AlertTriangle size={12} />
                  {selected.complaints[0].status === "ABERTA" ? "Reclamação em análise" : "Reclamação resolvida"}
                </div>
              )}

              {/* Temporizador de espera — mostra horário */}
              <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                Pedido criado em {new Date(selected.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
