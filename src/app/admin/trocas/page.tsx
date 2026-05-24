"use client"

import { useEffect, useState } from "react"
import { CheckCircle, ArrowLeftRight, Clock, XCircle, Package, Search, X, ChevronRight } from "lucide-react"

type TradeItem = { product: { name: string }; quantity: number }
type TradeUser = { id: string; name: string; discordId: string | null }
type Proposal = {
  id: string
  proposer: TradeUser
  offerItems: TradeItem[]
  status: string
}
type Trade = {
  id: string
  status: "AGUARDANDO_RECOLHIMENTO" | "AGUARDANDO_ENTREGA" | "CONCLUIDA" | "COM_RECLAMACAO"
  user: TradeUser
  offerItems: TradeItem[]
  proposals: Proposal[]
  createdAt: string
  updatedAt: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  AGUARDANDO_RECOLHIMENTO: { bg: "rgba(255,159,10,0.12)", color: "#FF9F0A", label: "Aguardando recolhimento", icon: Clock },
  AGUARDANDO_ENTREGA:      { bg: "rgba(0,113,227,0.1)",  color: "var(--accent)", label: "Aguardando entrega", icon: Package },
  CONCLUIDA:               { bg: "rgba(48,209,88,0.1)",  color: "var(--success)", label: "Concluída", icon: CheckCircle },
  COM_RECLAMACAO:          { bg: "rgba(255,69,58,0.1)",  color: "var(--error)", label: "Com reclamação", icon: XCircle },
}

const TABS = ["TODOS", "AGUARDANDO_RECOLHIMENTO", "AGUARDANDO_ENTREGA", "COM_RECLAMACAO", "CONCLUIDA"]
const TAB_LABELS: Record<string, string> = {
  TODOS: "Todos",
  AGUARDANDO_RECOLHIMENTO: "Recolhimento",
  AGUARDANDO_ENTREGA: "Entrega",
  COM_RECLAMACAO: "Reclamações",
  CONCLUIDA: "Concluídas",
}

export default function AdminTrocas() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Trade | null>(null)
  const [tab, setTab] = useState("TODOS")
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/admin/trocas")
    setTrades(await res.json())
    setLoading(false)
  }

  async function advance(trade: Trade, action: "recolheu" | "entregou") {
    setUpdating(true)
    await fetch(`/api/admin/trocas/${trade.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    setUpdating(false)
    await load()
    setSelected(null)
  }

  const filtered = trades.filter((t) => {
    const matchTab = tab === "TODOS" || t.status === tab
    const proposer = t.proposals[0]?.proposer.name ?? ""
    const matchSearch = !search ||
      t.user.name.toLowerCase().includes(search.toLowerCase()) ||
      proposer.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const counts = {
    AGUARDANDO_RECOLHIMENTO: trades.filter((t) => t.status === "AGUARDANDO_RECOLHIMENTO").length,
    AGUARDANDO_ENTREGA: trades.filter((t) => t.status === "AGUARDANDO_ENTREGA").length,
    COM_RECLAMACAO: trades.filter((t) => t.status === "COM_RECLAMACAO").length,
    CONCLUIDA: trades.filter((t) => t.status === "CONCLUIDA").length,
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Trocas
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
            {filtered.length}/{trades.length}
          </span>
        </h1>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {([
          ["AGUARDANDO_RECOLHIMENTO", "Aguardam recolhimento", "#FF9F0A"],
          ["AGUARDANDO_ENTREGA",      "Aguardam entrega",      "var(--accent)"],
          ["COM_RECLAMACAO",          "Com reclamação",        "var(--error)"],
          ["CONCLUIDA",               "Concluídas",            "var(--success)"],
        ] as const).map(([key, label, color]) => (
          <button key={key} onClick={() => setTab(key)}
            className="rounded-2xl p-4 text-left transition-all"
            style={{
              background: tab === key ? STATUS_STYLE[key].bg : "var(--surface-1)",
              border: `1px solid ${tab === key ? color : "var(--border)"}`,
            }}>
            <p className="text-2xl font-bold" style={{ color }}>{counts[key]}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{label}</p>
          </button>
        ))}
      </div>

      {/* Tabs + busca */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }}
            placeholder="Buscar por jogador ou ID..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ color: "var(--text-tertiary)" }}><X size={13} /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map((t) => {
            const count = t === "TODOS" ? trades.length : counts[t as keyof typeof counts]
            const isUrgent = (t === "AGUARDANDO_RECOLHIMENTO" || t === "AGUARDANDO_ENTREGA") && count > 0
            return (
              <button key={t} onClick={() => setTab(t)}
                className="text-xs px-3 py-1.5 rounded-full font-medium relative"
                style={{
                  background: tab === t ? "var(--accent)" : "var(--surface-1)",
                  color: tab === t ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${tab === t ? "transparent" : "var(--border)"}`,
                }}>
                {TAB_LABELS[t]} ({count})
                {isUrgent && tab !== t && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                    style={{ background: t === "COM_RECLAMACAO" ? "var(--error)" : "#FF9F0A" }} />
                )}
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
              {["ID", "Jogador A", "Jogador B", "Itens A", "Itens B", "Status", "Data"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Nenhuma troca</td></tr>
            ) : filtered.map((trade, i) => {
              const s = STATUS_STYLE[trade.status]
              const Icon = s.icon
              const proposer = trade.proposals[0]
              return (
                <tr key={trade.id} onClick={() => setSelected(trade)} className="cursor-pointer transition-colors"
                  style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--surface-1)" : "var(--bg)"}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                    #{trade.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {trade.user.name}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {proposer?.proposer.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {trade.offerItems.map((i) => `${i.product.name} x${i.quantity}`).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {proposer?.offerItems.map((i) => `${i.product.name} x${i.quantity}`).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit font-medium"
                      style={{ background: s.bg, color: s.color }}>
                      <Icon size={10} />{s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(trade.createdAt).toLocaleDateString("pt-BR")}
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

            {/* Header drawer */}
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
              {/* Badge de status */}
              {(() => {
                const s = STATUS_STYLE[selected.status]
                const Icon = s.icon
                return (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium w-fit"
                    style={{ background: s.bg, color: s.color }}>
                    <Icon size={14} />{s.label}
                  </div>
                )
              })()}

              {/* Jogadores */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-4 py-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Jogador A (dono da troca)</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selected.user.name}</p>
                  {selected.user.discordId && (
                    <p className="text-xs mt-0.5" style={{ color: "#5865F2" }}>Discord: {selected.user.discordId}</p>
                  )}
                </div>
                <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>Jogador B (proponente)</p>
                  {selected.proposals[0] ? (
                    <>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {selected.proposals[0].proposer.name}
                      </p>
                      {selected.proposals[0].proposer.discordId && (
                        <p className="text-xs mt-0.5" style={{ color: "#5865F2" }}>
                          Discord: {selected.proposals[0].proposer.discordId}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>—</p>
                  )}
                </div>
              </div>

              {/* Itens da troca */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                    ITENS DE A
                  </p>
                  <div className="flex flex-col gap-1">
                    {selected.offerItems.length > 0
                      ? selected.offerItems.map((item, i) => (
                          <p key={i} className="text-xs" style={{ color: "var(--text-primary)" }}>
                            • {item.product.name} <span style={{ color: "var(--text-tertiary)" }}>x{item.quantity}</span>
                          </p>
                        ))
                      : <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Nenhum item</p>
                    }
                  </div>
                </div>
                <div className="flex items-center">
                  <ArrowLeftRight size={16} style={{ color: "var(--text-tertiary)" }} />
                </div>
                <div className="flex-1 rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                    ITENS DE B
                  </p>
                  <div className="flex flex-col gap-1">
                    {selected.proposals[0]?.offerItems.length
                      ? selected.proposals[0].offerItems.map((item, i) => (
                          <p key={i} className="text-xs" style={{ color: "var(--text-primary)" }}>
                            • {item.product.name} <span style={{ color: "var(--text-tertiary)" }}>x{item.quantity}</span>
                          </p>
                        ))
                      : <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Nenhum item</p>
                    }
                  </div>
                </div>
              </div>

              {/* Passo a passo visual */}
              <div className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>PROGRESSO</p>
                {[
                  { key: "AGUARDANDO_RECOLHIMENTO", label: "Aguardando recolhimento" },
                  { key: "AGUARDANDO_ENTREGA",      label: "Itens recolhidos" },
                  { key: "CONCLUIDA",               label: "Itens entregues / Concluída" },
                ].map((step, i) => {
                  const statusOrder = ["AGUARDANDO_RECOLHIMENTO", "AGUARDANDO_ENTREGA", "CONCLUIDA"]
                  const currentIdx = statusOrder.indexOf(selected.status)
                  const stepIdx = statusOrder.indexOf(step.key)
                  const done = stepIdx < currentIdx || selected.status === "CONCLUIDA"
                  const active = step.key === selected.status
                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: done ? "var(--success)" : active ? "var(--accent)" : "var(--surface-1)",
                          color: done || active ? "#fff" : "var(--text-tertiary)",
                          border: `1px solid ${done ? "var(--success)" : active ? "var(--accent)" : "var(--border)"}`,
                        }}>
                        {done ? "✓" : i + 1}
                      </div>
                      <p className="text-xs" style={{
                        color: done ? "var(--success)" : active ? "var(--text-primary)" : "var(--text-tertiary)",
                        fontWeight: active ? 600 : 400,
                      }}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Ação: recolher */}
              {selected.status === "AGUARDANDO_RECOLHIMENTO" && (
                <div className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: "rgba(255,159,10,0.06)", border: "1px solid rgba(255,159,10,0.25)" }}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} style={{ color: "#FF9F0A" }} />
                    <p className="text-sm font-semibold" style={{ color: "#FF9F0A" }}>
                      Colete os itens de ambos os jogadores no jogo
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Entre em contato com Jogador A e Jogador B via Discord para combinar a retirada dos itens.
                  </p>
                  <button onClick={() => advance(selected, "recolheu")} disabled={updating}
                    className="flex items-center gap-2 text-xs px-4 py-2 rounded-full font-medium w-fit transition-colors"
                    style={{ background: "rgba(255,159,10,0.15)", color: "#FF9F0A", border: "1px solid rgba(255,159,10,0.35)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,159,10,0.25)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,159,10,0.15)"}>
                    {updating ? "Registrando..." : <><CheckCircle size={13} /> Já recolhi os itens de ambos</>}
                  </button>
                </div>
              )}

              {/* Ação: entregar */}
              {selected.status === "AGUARDANDO_ENTREGA" && (
                <div className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: "rgba(0,113,227,0.06)", border: "1px solid rgba(0,113,227,0.2)" }}>
                  <div className="flex items-center gap-2">
                    <Package size={14} style={{ color: "var(--accent)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      Entregue os itens aos novos donos in-game
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Entregue os itens de A para B e os itens de B para A dentro do jogo.
                  </p>
                  <button onClick={() => advance(selected, "entregou")} disabled={updating}
                    className="flex items-center gap-2 text-xs px-4 py-2 rounded-full font-medium w-fit transition-colors"
                    style={{ background: "rgba(0,113,227,0.12)", color: "var(--accent)", border: "1px solid rgba(0,113,227,0.3)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,113,227,0.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,113,227,0.12)"}>
                    {updating ? "Registrando..." : <><ChevronRight size={13} /> Já entreguei os itens</>}
                  </button>
                </div>
              )}

              {/* Concluída */}
              {selected.status === "CONCLUIDA" && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(48,209,88,0.08)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.2)" }}>
                  <CheckCircle size={15} /> Troca concluída com sucesso
                </div>
              )}

              {/* Reclamação */}
              {selected.status === "COM_RECLAMACAO" && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,69,58,0.08)", color: "var(--error)", border: "1px solid rgba(255,69,58,0.2)" }}>
                  <XCircle size={15} /> Troca com reclamação — intervir manualmente
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
