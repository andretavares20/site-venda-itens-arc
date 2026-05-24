"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle, X } from "lucide-react"
import Link from "next/link"

type Complaint = {
  id: string
  role: "COMPRADOR" | "VENDEDOR"
  description: string
  status: "ABERTA" | "RESOLVIDA"
  resolution: string | null
  resolvedAt: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
  order: { id: string; total: number } | null
  trade: { id: string } | null
  resolvedBy: { name: string } | null
}

export default function AdminReclamacoes() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Complaint | null>(null)
  const [filter, setFilter] = useState<"TODAS" | "ABERTA" | "RESOLVIDA">("ABERTA")
  const [resolution, setResolution] = useState("")
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/reclamacoes")
    setComplaints(await res.json())
    setLoading(false)
  }

  async function resolve() {
    if (!selected || !resolution.trim()) { setError("Informe a resolução"); return }
    setResolving(true)
    const res = await fetch(`/api/reclamacoes/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution }),
    })
    setResolving(false)
    if (res.ok) {
      setResolution("")
      setSelected(null)
      await load()
    } else {
      const data = await res.json()
      setError(data.error ?? "Erro ao resolver")
    }
  }

  const filtered = complaints.filter((c) => filter === "TODAS" || c.status === filter)
  const openCount = complaints.filter((c) => c.status === "ABERTA").length

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Reclamações
          {openCount > 0 && (
            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)" }}>
              {openCount} abertas
            </span>
          )}
        </h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {(["ABERTA", "RESOLVIDA", "TODAS"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              background: filter === f ? "var(--accent)" : "var(--surface-1)",
              color: filter === f ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${filter === f ? "transparent" : "var(--border)"}`,
            }}>
            {f === "ABERTA" ? "Abertas" : f === "RESOLVIDA" ? "Resolvidas" : "Todas"}
            {" "}({f === "TODAS" ? complaints.length : complaints.filter((c) => c.status === f).length})
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              {["Usuário", "Ref.", "Papel", "Descrição", "Status", "Data"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Nenhuma reclamação</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} onClick={() => { setSelected(c); setResolution(""); setError("") }}
                className="cursor-pointer transition-colors"
                style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--surface-1)" : "var(--bg)"}>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{c.user.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{c.user.email}</p>
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {c.order ? (
                    <Link href={`/pedido/${c.order.id}`} onClick={(e) => e.stopPropagation()}
                      className="hover:underline" style={{ color: "var(--accent)" }}>
                      #{c.order.id.slice(-8).toUpperCase()}
                    </Link>
                  ) : c.trade ? (
                    <span>Troca #{c.trade.id.slice(-8).toUpperCase()}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: c.role === "COMPRADOR" ? "rgba(0,113,227,0.1)" : "rgba(48,209,88,0.1)",
                      color: c.role === "COMPRADOR" ? "var(--accent)" : "var(--success)",
                    }}>
                    {c.role === "COMPRADOR" ? "Comprador" : "Vendedor"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs max-w-[200px] truncate" style={{ color: "var(--text-secondary)" }}>
                  {c.description}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: c.status === "ABERTA" ? "var(--error)" : "var(--success)" }}>
                    {c.status === "ABERTA"
                      ? <><AlertTriangle size={11} /> Aberta</>
                      : <><CheckCircle size={11} /> Resolvida</>}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer lateral */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)} />
          <aside className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{ width: "min(460px,100vw)", background: "var(--surface-1)", borderLeft: "1px solid var(--border)" }}>

            <div className="flex items-center justify-between px-5 py-4 sticky top-0"
              style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Reclamação</p>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ color: "var(--text-secondary)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-5 p-5">
              {error && (
                <p className="text-xs px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)" }}>
                  {error}
                </p>
              )}

              {/* Info */}
              <div className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Usuário</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: selected.role === "COMPRADOR" ? "rgba(0,113,227,0.1)" : "rgba(48,209,88,0.1)",
                      color: selected.role === "COMPRADOR" ? "var(--accent)" : "var(--success)",
                    }}>
                    {selected.role === "COMPRADOR" ? "Comprador" : "Vendedor"}
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selected.user.name}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{selected.user.email}</p>

                {selected.order && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Pedido</p>
                    <Link href={`/pedido/${selected.order.id}`}
                      className="text-sm font-mono hover:underline"
                      style={{ color: "var(--accent)" }}>
                      #{selected.order.id.slice(-8).toUpperCase()} — R$ {Number(selected.order.total).toFixed(2)}
                    </Link>
                  </div>
                )}

                {selected.trade && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Troca</p>
                    <p className="text-sm font-mono" style={{ color: "var(--text-primary)" }}>
                      #{selected.trade.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>RELATO</p>
                <p className="text-sm p-4 rounded-xl" style={{ background: "var(--surface-2)", color: "var(--text-primary)", lineHeight: 1.6 }}>
                  {selected.description}
                </p>
              </div>

              {/* Resolução */}
              {selected.status === "RESOLVIDA" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--success)" }}>
                    <CheckCircle size={13} />
                    Resolvida por {selected.resolvedBy?.name} em {selected.resolvedAt ? new Date(selected.resolvedAt).toLocaleDateString("pt-BR") : "—"}
                  </div>
                  <p className="text-sm p-4 rounded-xl" style={{ background: "rgba(48,209,88,0.06)", border: "1px solid rgba(48,209,88,0.2)", color: "var(--text-primary)" }}>
                    {selected.resolution}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>RESOLUÇÃO</p>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Descreva o que foi decidido (ex: reembolso aprovado, ban aplicado, etc.)..."
                    rows={4}
                    className="w-full text-sm p-3 rounded-xl resize-none outline-none"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  />
                  <button onClick={resolve} disabled={resolving}
                    className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
                    style={{ background: "var(--success)", color: "#fff" }}>
                    {resolving ? "Resolvendo..." : "Marcar como resolvida"}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
