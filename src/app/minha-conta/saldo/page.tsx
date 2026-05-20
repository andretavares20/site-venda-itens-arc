"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import { ArrowLeft, DollarSign, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"

type Withdrawal = {
  id: string
  amount: number
  pixKey: string
  status: "PENDENTE" | "PAGO" | "CANCELADO"
  createdAt: string
}

const statusStyle = {
  PENDENTE:  { label: "Aguardando pagamento", color: "var(--warning)",  bg: "rgba(255,214,10,0.1)",  icon: Clock },
  PAGO:      { label: "Pago",                color: "var(--success)",  bg: "rgba(48,209,88,0.1)",   icon: CheckCircle },
  CANCELADO: { label: "Cancelado",           color: "var(--error)",    bg: "rgba(255,69,58,0.1)",   icon: XCircle },
}

const SAQUE_MINIMO = 0.01

export default function SaldoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    Promise.all([
      fetch("/api/usuario/perfil").then((r) => r.json()),
      fetch("/api/saques").then((r) => r.json()),
    ]).then(([profile, saques]) => {
      setBalance(Number(profile.balance ?? 0))
      setWithdrawals(saques)
      setLoading(false)
    })
  }, [status])

  async function handleSaque() {
    setError("")
    setRequesting(true)
    const res = await fetch("/api/saques", { method: "POST" })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
    } else {
      setSuccess(true)
      setBalance(0)
      setWithdrawals((prev) => [{ ...data, amount: Number(data.amount) }, ...prev])
    }
    setRequesting(false)
  }

  if (status === "loading" || status === "unauthenticated") return null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-xl mx-auto">
        <Link href="/minha-conta" className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
          <ArrowLeft size={15} /> Minha conta
        </Link>

        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Meu saldo</h1>

        {/* Card de saldo */}
        <div className="rounded-2xl p-6 mb-6 flex flex-col gap-4"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(48,209,88,0.1)" }}>
              <DollarSign size={22} style={{ color: "var(--success)" }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Saldo disponível</p>
              <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                R$ {loading ? "—" : (balance ?? 0).toFixed(2)}
              </p>
            </div>
          </div>

          {!loading && (balance ?? 0) < SAQUE_MINIMO && (balance ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-xs p-3 rounded-xl"
              style={{ background: "rgba(255,214,10,0.08)", color: "var(--warning)", border: "1px solid rgba(255,214,10,0.2)" }}>
              <AlertCircle size={13} />
              Saque mínimo de R$ {SAQUE_MINIMO.toFixed(2)}. Aguarde mais vendas.
            </div>
          )}

          {error && (
            <div className="text-sm px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-xl"
              style={{ background: "rgba(48,209,88,0.08)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.2)" }}>
              <CheckCircle size={14} />
              Saque solicitado! A administração processará em breve.
            </div>
          )}

          <button
            onClick={handleSaque}
            disabled={requesting || loading || (balance ?? 0) < SAQUE_MINIMO}
            className="btn-primary w-full"
          >
            {requesting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Solicitando...
              </span>
            ) : `Solicitar saque · R$ ${(balance ?? 0).toFixed(2)}`}
          </button>

          <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
            Após solicitar, a administração entrará em contato para combinar o envio.
          </p>
        </div>

        {/* Histórico */}
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Histórico de saques
        </h2>

        {withdrawals.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>
            Nenhum saque solicitado ainda
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {withdrawals.map((w) => {
              const s = statusStyle[w.status]
              const Icon = s.icon
              return (
                <div key={w.id} className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: s.bg }}>
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      R$ {Number(w.amount).toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {w.pixKey} · {new Date(w.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
