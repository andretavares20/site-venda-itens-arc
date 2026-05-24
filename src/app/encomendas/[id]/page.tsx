"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Navbar from "@/components/navbar"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Package, Star, Trash2, X } from "lucide-react"

type Seller = { id: string; name: string }
type Proposal = {
  id: string
  sellerId: string
  seller: Seller
  price: number
  note: string | null
  status: "PENDENTE" | "ACEITA" | "RECUSADA" | "CANCELADA"
  createdAt: string
}
type Encomenda = {
  id: string
  buyerId: string
  buyer: { id: string; name: string }
  product: { id: string; name: string; image: string; category: string }
  quantity: number
  maxPrice: number | null
  note: string | null
  status: "ABERTA" | "ACEITA" | "PAGA" | "CONCLUIDA" | "CANCELADA"
  createdAt: string
  proposals: Proposal[]
}

const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta",
  ACEITA: "Proposta aceita — aguardando pagamento",
  PAGA: "Paga — aguardando entrega",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
}

export default function EncomendaPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const router = useRouter()

  const [encomenda, setEncomenda] = useState<Encomenda | null>(null)
  const [price, setPrice] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function load() {
    const res = await fetch(`/api/encomendas/${id}`)
    if (res.ok) setEncomenda(await res.json())
  }

  useEffect(() => { load() }, [id])

  const isBuyer = session?.user.id === encomenda?.buyerId
  const alreadyProposed = !!encomenda?.proposals.find(
    (p) => p.sellerId === session?.user.id && p.status === "PENDENTE"
  )

  async function submitProposal() {
    if (!price || parseFloat(price) <= 0) { setError("Informe um preço válido."); return }
    setLoading(true)
    setError("")
    const res = await fetch(`/api/encomendas/${id}/propostas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: parseFloat(price), note: note || undefined }),
    })
    setLoading(false)
    if (res.ok) { setPrice(""); setNote(""); load() }
    else { const d = await res.json(); setError(d.error ?? "Erro ao enviar proposta.") }
  }

  async function handleAction(proposalId: string, action: "ACEITAR" | "RECUSAR") {
    setActionLoading(proposalId + action)
    const res = await fetch(`/api/encomendas/${id}/propostas/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setActionLoading(null)
    if (res.ok) {
      if (action === "ACEITAR") {
        const data = await res.json()
        router.push(`/pedido/${data.orderId}`)
      } else {
        load()
      }
    } else {
      const d = await res.json()
      setError(d.error ?? "Erro.")
    }
  }

  async function cancelEncomenda() {
    if (!confirm("Cancelar esta encomenda?")) return
    await fetch(`/api/encomendas/${id}`, { method: "DELETE" })
    router.push("/minha-conta/encomendas")
  }

  if (!encomenda) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
        </div>
      </div>
    )
  }

  const pendingProposals = encomenda.proposals.filter((p) => p.status === "PENDENTE")
  const otherProposals = encomenda.proposals.filter((p) => p.status !== "PENDENTE")

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ background: "var(--surface-2)" }}>
            <Image src={encomenda.product.image} alt={encomenda.product.name}
              width={64} height={64} className="w-full h-full object-contain p-1" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {encomenda.product.name}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {encomenda.quantity}x · por {encomenda.buyer.name}
            </p>
            <span className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full font-medium"
              style={{
                background: encomenda.status === "ABERTA" ? "rgba(48,209,88,0.1)" : "var(--surface-2)",
                color: encomenda.status === "ABERTA" ? "var(--success)" : "var(--text-secondary)",
              }}>
              {STATUS_LABEL[encomenda.status]}
            </span>
          </div>
          {isBuyer && encomenda.status === "ABERTA" && (
            <button onClick={cancelEncomenda}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
              style={{ color: "var(--error)", border: "1px solid rgba(255,69,58,0.3)", background: "none", cursor: "pointer" }}>
              <Trash2 size={12} /> Cancelar
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Detalhes */}
          <div className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            {encomenda.maxPrice && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--text-secondary)" }}>Preço máximo</span>
                <span className="font-semibold" style={{ color: "var(--success)" }}>
                  R$ {Number(encomenda.maxPrice).toFixed(2)}
                </span>
              </div>
            )}
            {encomenda.note && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {encomenda.note}
              </p>
            )}
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Publicado em {new Date(encomenda.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Propostas pendentes */}
          {pendingProposals.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                PROPOSTAS ({pendingProposals.length})
              </p>
              {pendingProposals.map((p) => (
                <div key={p.id} className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        R$ {Number(p.price).toFixed(2)}{" "}
                        <span className="text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>
                          · total R$ {(Number(p.price) * encomenda.quantity).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        por {p.seller.name}
                      </p>
                      {p.note && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{p.note}</p>
                      )}
                    </div>
                    {encomenda.maxPrice && Number(p.price) <= Number(encomenda.maxPrice) && (
                      <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: "rgba(48,209,88,0.1)", color: "var(--success)" }}>
                        Dentro do orçamento
                      </span>
                    )}
                  </div>
                  {isBuyer && encomenda.status === "ABERTA" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(p.id, "ACEITAR")}
                        disabled={actionLoading === p.id + "ACEITAR"}
                        className="btn-primary text-xs flex-1"
                        style={{ padding: "0.375rem 0.75rem" }}>
                        <CheckCircle size={13} />
                        {actionLoading === p.id + "ACEITAR" ? "Aceitando..." : "Aceitar e pagar"}
                      </button>
                      <button
                        onClick={() => handleAction(p.id, "RECUSAR")}
                        disabled={actionLoading === p.id + "RECUSAR"}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full"
                        style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>
                        <X size={12} />
                        {actionLoading === p.id + "RECUSAR" ? "..." : "Recusar"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {pendingProposals.length === 0 && encomenda.status === "ABERTA" && (
            <div className="flex flex-col items-center gap-2 py-8 rounded-2xl"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <Star size={28} style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Nenhuma proposta ainda
              </p>
            </div>
          )}

          {/* Formulário de proposta (vendedores) */}
          {session && !isBuyer && encomenda.status === "ABERTA" && !alreadyProposed && (
            <div className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Fazer proposta
              </h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Seu preço por unidade (R$)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>R$</span>
                  <input type="number" min={0.01} step={0.01} value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0,00" className="input-field w-40" />
                  {price && parseFloat(price) > 0 && (
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Total: R$ {(parseFloat(price) * encomenda.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  Mensagem <span style={{ color: "var(--text-tertiary)" }}>(opcional)</span>
                </label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Consigo farmar em até 2h..."
                  className="input-field resize-none" />
              </div>
              {error && (
                <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>
              )}
              <button onClick={submitProposal} disabled={loading} className="btn-primary text-sm self-start"
                style={{ padding: "0.5rem 1.25rem" }}>
                {loading ? "Enviando..." : "Enviar proposta"}
              </button>
            </div>
          )}

          {alreadyProposed && (
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.2)" }}>
              <CheckCircle size={16} style={{ color: "var(--accent)" }} />
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                Você já tem uma proposta pendente nesta encomenda.
              </p>
            </div>
          )}

          {!session && encomenda.status === "ABERTA" && (
            <div className="rounded-2xl p-4 text-center"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                Entre para fazer uma proposta
              </p>
              <Link href="/login" className="btn-primary text-sm" style={{ padding: "0.5rem 1.25rem" }}>
                Entrar
              </Link>
            </div>
          )}

          {/* Histórico de propostas */}
          {otherProposals.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                HISTÓRICO
              </p>
              {otherProposals.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl text-sm"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {p.seller.name} · R$ {Number(p.price).toFixed(2)}
                  </span>
                  <span className="text-xs font-medium"
                    style={{ color: p.status === "ACEITA" ? "var(--success)" : "var(--text-tertiary)" }}>
                    {p.status === "ACEITA" ? "Aceita ✓" : p.status === "RECUSADA" ? "Recusada" : "Cancelada"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link href="/encomendas"
            className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
            ← Voltar às encomendas
          </Link>
        </div>
      </main>
    </div>
  )
}
