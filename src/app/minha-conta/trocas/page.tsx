"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import Image from "next/image"
import { Plus, ArrowLeftRight, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ABERTA:                  { label: "Aberta",                   color: "var(--success)",  icon: CheckCircle },
  AGUARDANDO_CONFIRMACAO:  { label: "Aguardando confirmação",   color: "var(--warning)",  icon: Clock },
  CONCLUIDA:               { label: "Concluída",                color: "var(--accent)",   icon: CheckCircle },
  CANCELADA:               { label: "Cancelada",                color: "var(--error)",    icon: XCircle },
  COM_RECLAMACAO:          { label: "Com reclamação",           color: "var(--error)",    icon: AlertCircle },
}

type TradeItem = { id: string; quantity: number; product: { name: string; image: string; rarity: string } }
type Trade = { id: string; status: string; createdAt: string; offerItems: TradeItem[]; wantItems: TradeItem[]; proposals: { id: string }[] }

function TradeCard({ trade }: { trade: Trade }) {
  const s = statusConfig[trade.status] ?? statusConfig.ABERTA
  const Icon = s.icon
  return (
    <Link href={`/trocas/${trade.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border)", textDecoration: "none" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.transform = "translateY(-1px)" }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
      <div className="flex items-center gap-1.5 w-5 h-5 flex-shrink-0">
        <Icon size={16} style={{ color: s.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${s.color}18`, color: s.color }}>{s.label}</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {trade.proposals.length} proposta{trade.proposals.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {trade.offerItems.slice(0, 3).map((item) => (
              <div key={item.id} className="w-7 h-7 rounded-lg overflow-hidden" style={{ background: "#0d0d0d" }}>
                <Image src={item.product.image} alt={item.product.name} width={28} height={28} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
          <ArrowLeftRight size={13} style={{ color: "var(--text-tertiary)" }} />
          {trade.wantItems.length === 0 ? (
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Qualquer proposta</span>
          ) : (
            <div className="flex gap-1">
              {trade.wantItems.slice(0, 3).map((item) => (
                <div key={item.id} className="w-7 h-7 rounded-lg overflow-hidden" style={{ background: "#0d0d0d" }}>
                  <Image src={item.product.image} alt={item.product.name} width={28} height={28} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
        {new Date(trade.createdAt).toLocaleDateString("pt-BR")}
      </span>
    </Link>
  )
}

export default function MinhasTrocasPage() {
  const { status } = useSession()
  const router = useRouter()
  const [trades, setTrades] = useState<Trade[]>([])
  const [proposed, setProposed] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    Promise.all([
      fetch("/api/trocas?mine=1").then((r) => r.json()),
      fetch("/api/trocas?proposed=1").then((r) => r.json()),
    ]).then(([myTrades, myProposals]) => {
      setTrades(myTrades)
      setProposed(myProposals)
      setLoading(false)
    })
  }, [status])

  if (status === "loading" || status === "unauthenticated") return null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Minhas trocas</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Anúncios publicados e propostas enviadas</p>
          </div>
          <Link href="/trocas/nova" className="btn-primary text-sm">
            <Plus size={15} /> Nova troca
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : (
          <>
            {/* Meus anúncios */}
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
                Meus anúncios
              </p>
              {trades.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 rounded-2xl text-center"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <ArrowLeftRight size={36} style={{ color: "var(--text-tertiary)" }} />
                  <p style={{ color: "var(--text-secondary)" }}>Você ainda não criou nenhuma troca</p>
                  <Link href="/trocas/nova" className="btn-primary text-sm">Criar primeira troca</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {trades.map((trade) => <TradeCard key={trade.id} trade={trade} />)}
                </div>
              )}
            </div>

            {/* Propostas enviadas */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
                Propostas enviadas
              </p>
              {proposed.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 rounded-2xl text-center"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <ArrowLeftRight size={36} style={{ color: "var(--text-tertiary)" }} />
                  <p style={{ color: "var(--text-secondary)" }}>Você ainda não fez nenhuma proposta de troca</p>
                  <Link href="/trocas" className="btn-primary text-sm">Ver trocas disponíveis</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {proposed.map((trade) => <TradeCard key={trade.id} trade={trade} />)}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
