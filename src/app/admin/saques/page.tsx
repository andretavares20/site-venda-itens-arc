"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Clock, Copy } from "lucide-react"

type Withdrawal = {
  id: string
  amount: number
  pixKey: string
  status: "PENDENTE" | "PAGO" | "CANCELADO"
  createdAt: string
  user: { name: string; email: string }
}

const statusStyle = {
  PENDENTE:  { label: "Pendente",  color: "var(--warning)", bg: "rgba(255,214,10,0.1)"  },
  PAGO:      { label: "Pago",      color: "var(--success)", bg: "rgba(48,209,88,0.1)"   },
  CANCELADO: { label: "Cancelado", color: "var(--error)",   bg: "rgba(255,69,58,0.1)"   },
}

export default function AdminSaquesPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [filter, setFilter] = useState("PENDENTE")

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/saques")
    setWithdrawals(await res.json())
    setLoading(false)
  }

  async function handleAction(id: string, action: "pagar" | "cancelar") {
    setActing(id + action)
    const res = await fetch(`/api/saques/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    setActing(null)
    if (!res.ok) alert(`Erro: ${data.error}`)
    load()
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = withdrawals.filter((w) => filter === "TODOS" || w.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Saques
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
            ({withdrawals.filter((w) => w.status === "PENDENTE").length} pendentes)
          </span>
        </h1>
        <div className="flex items-center gap-2">
          {["PENDENTE", "PAGO", "CANCELADO", "TODOS"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: filter === s ? "var(--accent)" : "var(--surface-2)",
                color: filter === s ? "#fff" : "var(--text-secondary)",
              }}>
              {s === "TODOS" ? "Todos" : statusStyle[s as keyof typeof statusStyle]?.label}
              {" "}({withdrawals.filter((w) => s === "TODOS" || w.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
          Nenhum saque nesta categoria
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((w) => {
            const s = statusStyle[w.status]
            return (
              <div key={w.id} className="rounded-2xl overflow-hidden"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        {w.user.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{w.user.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(w.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    R$ {Number(w.amount).toFixed(2)}
                  </span>
                </div>

                {w.status === "PENDENTE" && (
                  <div className="px-5 pb-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-xl"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Chave PIX</p>
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {w.pixKey}
                        </p>
                      </div>
                      <button
                        onClick={() => copy(w.pixKey, w.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                        style={{ background: copied === w.id ? "var(--success)" : "var(--accent)", color: "#fff" }}>
                        {copied === w.id ? <><CheckCircle size={11} className="inline mr-1" />Copiado</> : <><Copy size={11} className="inline mr-1" />Copiar</>}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(w.id, "pagar")}
                        disabled={!!acting}
                        className="btn-primary flex-1 text-sm">
                        <CheckCircle size={14} />
                        {acting === w.id + "pagar" ? "Processando..." : "Confirmar pagamento enviado"}
                      </button>
                      <button
                        onClick={() => handleAction(w.id, "cancelar")}
                        disabled={!!acting}
                        className="text-sm px-4 py-2 rounded-full flex-shrink-0"
                        style={{ color: "var(--error)", border: "1px solid rgba(255,69,58,0.3)" }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
