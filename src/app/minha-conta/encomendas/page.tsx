"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Link from "next/link"
import Image from "next/image"
import { Package, Plus } from "lucide-react"

type Proposal = { id: string; price: number; status: string; encomenda: { id: string; product: { name: string; image: string }; quantity: number } }
type Encomenda = { id: string; status: string; product: { name: string; image: string }; quantity: number; maxPrice: number | null; proposals: { id: string; status: string }[]; createdAt: string }

const STATUS_COLOR: Record<string, string> = {
  ABERTA: "var(--success)",
  ACEITA: "var(--accent)",
  PAGA: "var(--accent)",
  CONCLUIDA: "var(--text-tertiary)",
  CANCELADA: "var(--error)",
}
const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta",
  ACEITA: "Proposta aceita",
  PAGA: "Paga",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
}

export default function MinhasEncomendasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [encomendas, setEncomendas] = useState<Encomenda[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    Promise.all([
      fetch("/api/encomendas/minhas").then((r) => r.json()),
      fetch("/api/encomendas/minhas-propostas").then((r) => r.json()),
    ]).then(([enc, prop]) => {
      setEncomendas(enc)
      setProposals(prop)
      setLoading(false)
    })
  }, [status])

  if (status === "loading" || status === "unauthenticated") return null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Minhas encomendas
          </h1>
          <Link href="/encomendas/nova" className="btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> Nova
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Encomendas como comprador */}
            <section>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                ENCOMENDAS QUE FIZ
              </p>
              {encomendas.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 rounded-2xl"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <Package size={32} style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nenhuma encomenda criada</p>
                  <Link href="/encomendas/nova" className="btn-primary text-sm" style={{ padding: "0.375rem 1rem" }}>
                    Criar encomenda
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {encomendas.map((e) => {
                    const pendingCount = e.proposals.filter((p) => p.status === "PENDENTE").length
                    return (
                      <Link key={e.id} href={`/encomendas/${e.id}`}
                        className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                        style={{ background: "var(--surface-1)", border: "1px solid var(--border)", textDecoration: "none" }}
                        onMouseEnter={(el) => (el.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"}
                        onMouseLeave={(el) => (el.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                          style={{ background: "var(--surface-2)" }}>
                          <Image src={e.product.image} alt={e.product.name} width={48} height={48}
                            className="w-full h-full object-contain p-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                            {e.product.name} x{e.quantity}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-medium" style={{ color: STATUS_COLOR[e.status] }}>
                              {STATUS_LABEL[e.status]}
                            </span>
                            {pendingCount > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: "var(--accent)", color: "#fff" }}>
                                {pendingCount} proposta{pendingCount > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        {e.maxPrice && (
                          <span className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                            até R$ {Number(e.maxPrice).toFixed(2)}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Propostas como vendedor */}
            <section>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                PROPOSTAS QUE FIZ
              </p>
              {proposals.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 rounded-2xl"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Você ainda não fez propostas
                  </p>
                  <Link href="/encomendas" className="text-sm" style={{ color: "var(--accent)" }}>
                    Ver encomendas abertas →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {proposals.map((p) => (
                    <Link key={p.id} href={`/encomendas/${p.encomenda.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                      style={{ background: "var(--surface-1)", border: "1px solid var(--border)", textDecoration: "none" }}
                      onMouseEnter={(el) => (el.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"}
                      onMouseLeave={(el) => (el.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: "var(--surface-2)" }}>
                        <Image src={p.encomenda.product.image} alt={p.encomenda.product.name}
                          width={48} height={48} className="w-full h-full object-contain p-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {p.encomenda.product.name} x{p.encomenda.quantity}
                        </p>
                        <p className="text-xs mt-0.5 font-medium"
                          style={{ color: p.status === "ACEITA" ? "var(--success)" : p.status === "PENDENTE" ? "var(--warning)" : "var(--text-tertiary)" }}>
                          {p.status === "ACEITA" ? "Aceita ✓" : p.status === "PENDENTE" ? "Aguardando resposta" : p.status === "RECUSADA" ? "Recusada" : "Cancelada"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                        R$ {Number(p.price).toFixed(2)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
