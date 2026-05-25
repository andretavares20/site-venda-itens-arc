"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/navbar"
import { ArrowLeftRight, CheckCircle, XCircle, AlertCircle, Search, Plus, X, Clock, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Dialog from "@/components/dialog"
import { toast } from "@/lib/toast-store"

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

type Product = { id: string; name: string; image: string; rarity: string }
type TradeItem = { id: string; quantity: number; product: Product }
type Proposal = {
  id: string; status: string; note: string | null
  proposer: { id: string; name: string }
  offerItems: TradeItem[]
  ownerConfirmed: boolean; proposerConfirmed: boolean
}
type Trade = {
  id: string; status: string; note: string | null; expiresAt: string | null
  user: { id: string; name: string }
  offerItems: TradeItem[]
  wantItems: TradeItem[]
  proposals: Proposal[]
}

function ItemRow({ item }: { item: TradeItem }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
        <Image src={item.product.image} alt={item.product.name} width={32} height={32} className="w-full h-full object-contain" />
      </div>
      <div>
        <p className="text-sm font-medium leading-none" style={{ color: "var(--text-primary)" }}>{item.product.name}</p>
        <p className="text-xs" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>{item.product.rarity}</p>
      </div>
      {item.quantity > 1 && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>x{item.quantity}</span>}
    </div>
  )
}

export default function TrocaPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ action: string; proposalId: string; title: string; message: string } | null>(null)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [propItems, setPropItems] = useState<{ product: Product; quantity: number }[]>([])
  const [propNote, setPropNote] = useState("")
  const [propQuery, setPropQuery] = useState("")
  const [propResults, setPropResults] = useState<Product[]>([])
  const [submittingProp, setSubmittingProp] = useState(false)
  const [propError, setPropError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/trocas/${id}`)
    if (!res.ok) { setTrade(null); setLoading(false); return }
    const data = await res.json()
    setTrade(data)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!propQuery.trim()) { setPropResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/produtos?busca=${encodeURIComponent(propQuery)}`)
      setPropResults((await res.json()).slice(0, 8))
    }, 300)
    return () => clearTimeout(t)
  }, [propQuery])

  const actionToast: Record<string, string> = {
    aceitar:   "Proposta aceita! Aguarde a confirmação do outro jogador.",
    recusar:   "Proposta recusada.",
    confirmar: "Confirmação registrada!",
    cancelar:  "Troca cancelada.",
  }

  async function doAction(action: string, proposalId: string) {
    setActing(proposalId + action)
    setConfirmDialog(null)
    const res = await fetch(`/api/trocas/${id}/proposta/${proposalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setActing(null)
    if (res.ok) toast(actionToast[action] ?? "Ação realizada.")
    else toast("Erro ao realizar ação. Tente novamente.", "error")
    load()
  }

  async function submitProposal() {
    if (!propItems.length) return
    setSubmittingProp(true)
    setPropError(null)
    const res = await fetch(`/api/trocas/${id}/proposta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerItems: propItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        note: propNote || null,
      }),
    })
    setSubmittingProp(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setPropError(data.error ?? `Erro ao enviar proposta (${res.status})`)
      return
    }
    setShowProposalForm(false)
    setPropItems([])
    setPropNote("")
    toast("Proposta enviada! O dono do anúncio será notificado.")
    load()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <Navbar />
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
    </div>
  )

  if (!trade) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
      <Navbar />
      <p style={{ color: "var(--text-primary)" }}>Troca não encontrada</p>
      <Link href="/trocas" className="btn-secondary">Ver trocas</Link>
    </div>
  )

  const isOwner = session?.user.id === trade.user.id
  const acceptedProposal = trade.proposals.find((p) => p.status === "ACEITA")
  const myProposal = trade.proposals.find((p) => p.proposer.id === session?.user.id)
  const canPropose = session && !isOwner && !myProposal && trade.status === "ABERTA"

  const statusColor: Record<string, string> = {
    ABERTA: "var(--success)", AGUARDANDO_CONFIRMACAO: "var(--warning)",
    AGUARDANDO_RECOLHIMENTO: "var(--warning)", AGUARDANDO_ENTREGA: "var(--warning)",
    CONCLUIDA: "var(--accent)", CANCELADA: "var(--error)", COM_RECLAMACAO: "var(--error)",
  }
  const statusLabel: Record<string, string> = {
    ABERTA: "Aberta", AGUARDANDO_CONFIRMACAO: "Aguardando confirmação",
    AGUARDANDO_RECOLHIMENTO: "Aguardando recolhimento", AGUARDANDO_ENTREGA: "Aguardando entrega",
    CONCLUIDA: "Concluída", CANCELADA: "Cancelada", COM_RECLAMACAO: "Com reclamação",
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
          <ArrowLeft size={15} /> Voltar
        </button>

        {/* Card principal da troca */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Troca de {trade.user.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${statusColor[trade.status]}18`, color: statusColor[trade.status] }}>
                {statusLabel[trade.status]}
              </span>
            </div>
            {isOwner && trade.status === "ABERTA" && (
              <button onClick={() => setConfirmDialog({ action: "cancelar_trade", proposalId: "", title: "Cancelar troca?", message: "Seu anúncio será removido e as propostas pendentes serão recusadas." })}
                className="text-xs px-3 py-1 rounded-full"
                style={{ color: "var(--error)", border: "1px solid rgba(255,69,58,0.3)" }}>
                Cancelar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Oferece</p>
              <div className="flex flex-col gap-2">{trade.offerItems.map((i) => <ItemRow key={i.id} item={i} />)}</div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Quer receber</p>
              {trade.wantItems.length === 0 ? (
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Aceita qualquer proposta</span>
              ) : (
                <div className="flex flex-col gap-2">{trade.wantItems.map((i) => <ItemRow key={i.id} item={i} />)}</div>
              )}
            </div>
          </div>

          {trade.note && (
            <p className="mt-4 text-sm pt-4" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>
              {trade.note}
            </p>
          )}
        </div>

        {/* Troca aceita — confirmação */}
        {acceptedProposal && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,214,10,0.06)", border: "1px solid rgba(255,214,10,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} style={{ color: "var(--warning)" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--warning)" }}>
                Proposta aceita — façam a troca in-game e confirmem
              </span>
            </div>
            {trade.expiresAt && (
              <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                Confirmação automática em 24h se não houver reclamação.
              </p>
            )}
            <div className="flex gap-3">
              {((isOwner && !acceptedProposal.ownerConfirmed) || (!isOwner && acceptedProposal.proposer.id === session?.user.id && !acceptedProposal.proposerConfirmed)) && (
                <button onClick={() => setConfirmDialog({ action: "confirmar", proposalId: acceptedProposal.id, title: "Confirmar troca?", message: "Confirme apenas após receber o item in-game." })}
                  className="btn-primary text-sm flex-1">
                  <CheckCircle size={14} /> Confirmar troca feita
                </button>
              )}
              <button onClick={() => setConfirmDialog({ action: "reclamar", proposalId: acceptedProposal.id, title: "Abrir reclamação?", message: "A plataforma não se responsabiliza pelo resultado, mas registraremos o ocorrido." })}
                className="text-sm px-4 py-2 rounded-full flex-shrink-0"
                style={{ color: "var(--error)", border: "1px solid rgba(255,69,58,0.3)" }}>
                <AlertCircle size={14} className="inline mr-1" />
                Reclamar
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {acceptedProposal.ownerConfirmed && <span style={{ color: "var(--success)" }}>✓ {trade.user.name} confirmou</span>}
              {acceptedProposal.proposerConfirmed && <span style={{ color: "var(--success)" }}>✓ {acceptedProposal.proposer.name} confirmou</span>}
            </div>
          </div>
        )}

        {/* Formulário de proposta */}
        {canPropose && (
          <div className="mb-6">
            {!showProposalForm ? (
              <button onClick={() => setShowProposalForm(true)} className="btn-primary w-full">
                <ArrowLeftRight size={16} /> Fazer proposta
              </button>
            ) : (
              <div className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Sua proposta</h2>
                <div className="relative mb-3">
                  <div className="flex items-center gap-2 input-field" style={{ padding: "0.625rem 0.875rem" }}>
                    <Search size={14} style={{ color: "var(--text-tertiary)" }} />
                    <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }}
                      placeholder="Buscar item para oferecer..." value={propQuery} onChange={(e) => setPropQuery(e.target.value)} />
                  </div>
                  {propResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      {propResults.map((p) => (
                        <button key={p.id} onClick={() => { setPropItems((prev) => [...prev.filter((i) => i.product.id !== p.id), { product: p, quantity: 1 }]); setPropQuery(""); setPropResults([]) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ background: "#0d0d0d" }}>
                            <Image src={p.image} alt={p.name} width={28} height={28} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                            <p className="text-xs" style={{ color: rarityColor[p.rarity] ?? "#98989f" }}>{p.rarity}</p>
                          </div>
                          <Plus size={14} style={{ color: "var(--accent)" }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 mb-3">
                  {propItems.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-xl"
                      style={{ background: "var(--surface-2)" }}>
                      <div className="w-7 h-7 rounded-lg overflow-hidden" style={{ background: "#0d0d0d" }}>
                        <Image src={item.product.image} alt={item.product.name} width={28} height={28} className="w-full h-full object-contain" />
                      </div>
                      <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{item.product.name}</p>
                      <button onClick={() => setPropItems((p) => p.filter((i) => i.product.id !== item.product.id))}
                        style={{ color: "var(--text-tertiary)" }}><X size={13} /></button>
                    </div>
                  ))}
                </div>
                <textarea className="input-field text-sm resize-none mb-3" rows={2}
                  placeholder="Observação (opcional)" value={propNote} onChange={(e) => setPropNote(e.target.value)} />
                {propError && (
                  <p className="text-xs mb-3 px-1" style={{ color: "var(--error)" }}>{propError}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowProposalForm(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                  <button onClick={submitProposal} disabled={!propItems.length || submittingProp} className="btn-primary flex-1 text-sm">
                    {submittingProp ? "Enviando..." : "Enviar proposta"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de propostas */}
        {(isOwner || myProposal) && trade.proposals.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              {isOwner ? `Propostas recebidas (${trade.proposals.length})` : "Sua proposta"}
            </h2>
            <div className="flex flex-col gap-3">
              {(isOwner ? trade.proposals : trade.proposals.filter((p) => p.proposer.id === session?.user.id)).map((proposal) => {
                const ps: Record<string, string> = { PENDENTE: "var(--warning)", ACEITA: "var(--accent)", RECUSADA: "var(--error)", CANCELADA: "var(--text-tertiary)", CONCLUIDA: "var(--success)", COM_RECLAMACAO: "var(--error)" }
                const pl: Record<string, string> = { PENDENTE: "Pendente", ACEITA: "Aceita", RECUSADA: "Recusada", CANCELADA: "Cancelada", CONCLUIDA: "Concluída", COM_RECLAMACAO: "Com reclamação" }
                return (
                  <div key={proposal.id} className="rounded-2xl p-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{proposal.proposer.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${ps[proposal.status]}18`, color: ps[proposal.status] }}>
                          {pl[proposal.status]}
                        </span>
                      </div>
                      {isOwner && proposal.status === "PENDENTE" && (
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmDialog({ action: "aceitar", proposalId: proposal.id, title: "Aceitar proposta?", message: `Aceitar a proposta de ${proposal.proposer.name}? As demais propostas serão recusadas automaticamente.` })}
                            disabled={!!acting} className="text-xs px-3 py-1 rounded-full"
                            style={{ background: "rgba(48,209,88,0.1)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.3)" }}>
                            <CheckCircle size={11} className="inline mr-1" />Aceitar
                          </button>
                          <button onClick={() => doAction("recusar", proposal.id)} disabled={!!acting}
                            className="text-xs px-3 py-1 rounded-full"
                            style={{ color: "var(--error)", border: "1px solid rgba(255,69,58,0.3)" }}>
                            <XCircle size={11} className="inline mr-1" />Recusar
                          </button>
                        </div>
                      )}
                      {!isOwner && proposal.status === "PENDENTE" && (
                        <button onClick={() => doAction("cancelar", proposal.id)} disabled={!!acting}
                          className="text-xs px-3 py-1 rounded-full"
                          style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                          Cancelar proposta
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {proposal.offerItems.map((item) => <ItemRow key={item.id} item={item} />)}
                    </div>
                    {proposal.note && <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>{proposal.note}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {confirmDialog && (
        <Dialog
          open
          title={confirmDialog.title}
          message={confirmDialog.message}
          onClose={() => setConfirmDialog(null)}
          actions={[
            {
              label: confirmDialog.action === "reclamar" ? "Abrir reclamação" : confirmDialog.action === "cancelar_trade" ? "Cancelar troca" : "Confirmar",
              variant: confirmDialog.action === "reclamar" || confirmDialog.action === "cancelar_trade" ? "destructive" : "default",
              loading: !!acting,
              onClick: async () => {
                if (confirmDialog.action === "cancelar_trade") {
                  await fetch(`/api/trocas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CANCELADA" }) })
                  router.push("/trocas")
                } else {
                  doAction(confirmDialog.action, confirmDialog.proposalId)
                }
              },
            },
            { label: "Voltar", variant: "cancel", onClick: () => setConfirmDialog(null) },
          ]}
        />
      )}
    </div>
  )
}
