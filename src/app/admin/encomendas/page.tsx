"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle, Clock, XCircle, Search, X, Package,
  ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react"

type Seller = { id: string; name: string; discordId: string | null }
type Buyer  = { id: string; name: string; discordId: string | null }
type Product = { id: string; name: string; category: string; rarity: string }

type Proposal = {
  id: string
  seller: Seller
  price: number
  note: string | null
  status: "PENDENTE" | "ACEITA" | "RECUSADA" | "CANCELADA"
  order: { id: string; status: string } | null
  createdAt: string
}

type Encomenda = {
  id: string
  status: "ABERTA" | "ACEITA" | "PAGA" | "CONCLUIDA" | "CANCELADA"
  buyer: Buyer
  product: Product
  quantity: number
  maxPrice: number | null
  note: string | null
  proposals: Proposal[]
  createdAt: string
  updatedAt: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; icon: React.ElementType }> = {
  ABERTA:    { bg: "rgba(48,209,88,0.08)",   color: "var(--success)",        label: "Aberta",             icon: Package },
  ACEITA:    { bg: "rgba(255,159,10,0.10)",  color: "#FF9F0A",               label: "Aceita (aguard. pgto)", icon: Clock },
  PAGA:      { bg: "rgba(0,113,227,0.08)",   color: "var(--accent)",         label: "Paga",               icon: Clock },
  CONCLUIDA: { bg: "rgba(48,209,88,0.10)",   color: "var(--success)",        label: "Concluída",          icon: CheckCircle },
  CANCELADA: { bg: "rgba(99,99,102,0.10)",   color: "var(--text-tertiary)",  label: "Cancelada",          icon: XCircle },
}

const PROPOSAL_STYLE: Record<string, { color: string; label: string }> = {
  PENDENTE:  { color: "var(--text-secondary)", label: "Pendente" },
  ACEITA:    { color: "var(--success)",        label: "Aceita" },
  RECUSADA:  { color: "var(--error)",          label: "Recusada" },
  CANCELADA: { color: "var(--text-tertiary)",  label: "Cancelada" },
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDENTE:       "Aguardando pagamento",
  PAGO:           "Pago",
  ENTREGUE:       "Entregue",
  CANCELADO:      "Cancelado",
  COM_RECLAMACAO: "Com reclamação",
}

const RARITY_COLORS: Record<string, string> = {
  Common:    "var(--text-tertiary)",
  Uncommon:  "var(--success)",
  Rare:      "var(--accent)",
  Epic:      "#BF5AF2",
  Legendary: "#FF9F0A",
}

const TABS = ["TODOS", "ABERTA", "ACEITA", "PAGA", "CONCLUIDA", "CANCELADA"] as const
const TAB_LABELS: Record<string, string> = {
  TODOS:     "Todos",
  ABERTA:    "Abertas",
  ACEITA:    "Aceitas",
  PAGA:      "Pagas",
  CONCLUIDA: "Concluídas",
  CANCELADA: "Canceladas",
}

export default function AdminEncomendas() {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<Encomenda | null>(null)
  const [tab, setTab]               = useState("TODOS")
  const [search, setSearch]         = useState("")
  const [expanded, setExpanded]     = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/encomendas")
    if (res.ok) setEncomendas(await res.json())
    setLoading(false)
  }

  const counts = {
    ABERTA:    encomendas.filter((e) => e.status === "ABERTA").length,
    ACEITA:    encomendas.filter((e) => e.status === "ACEITA").length,
    PAGA:      encomendas.filter((e) => e.status === "PAGA").length,
    CONCLUIDA: encomendas.filter((e) => e.status === "CONCLUIDA").length,
    CANCELADA: encomendas.filter((e) => e.status === "CANCELADA").length,
  }

  const filtered = encomendas.filter((e) => {
    const matchTab = tab === "TODOS" || e.status === tab
    const q = search.toLowerCase()
    const matchSearch = !search ||
      e.buyer.name.toLowerCase().includes(q) ||
      e.product.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const acceptedProposal = (e: Encomenda) => e.proposals.find((p) => p.status === "ACEITA")

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Encomendas
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
            {filtered.length}/{encomendas.length}
          </span>
        </h1>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {([
          ["ABERTA",    "Abertas",              "var(--success)"],
          ["ACEITA",    "Aguardam pagamento",   "#FF9F0A"],
          ["PAGA",      "Pagas",                "var(--accent)"],
          ["CONCLUIDA", "Concluídas",           "var(--success)"],
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
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
            placeholder="Buscar por comprador, produto ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--text-tertiary)" }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map((t) => {
            const count = t === "TODOS" ? encomendas.length : counts[t as keyof typeof counts]
            return (
              <button key={t} onClick={() => setTab(t)}
                className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: tab === t ? "var(--accent)" : "var(--surface-1)",
                  color: tab === t ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${tab === t ? "transparent" : "var(--border)"}`,
                }}>
                {TAB_LABELS[t]} ({count})
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
              {["ID", "Comprador", "Produto", "Qtd", "Preço máx.", "Propostas", "Status", "Data"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
                  Nenhuma encomenda
                </td>
              </tr>
            ) : filtered.map((enc, i) => {
              const s = STATUS_STYLE[enc.status]
              const Icon = s.icon
              const pendingCount = enc.proposals.filter((p) => p.status === "PENDENTE").length
              return (
                <tr key={enc.id} onClick={() => setSelected(enc)} className="cursor-pointer transition-colors"
                  style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--surface-1)" : "var(--bg)"}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                    #{enc.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {enc.buyer.name}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-primary)" }}>
                    <span style={{ color: RARITY_COLORS[enc.product.rarity] ?? "var(--text-primary)" }}>
                      {enc.product.name}
                    </span>
                    <span className="ml-1" style={{ color: "var(--text-tertiary)" }}>({enc.product.category})</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    x{enc.quantity}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {enc.maxPrice != null
                      ? `R$ ${Number(enc.maxPrice).toFixed(2)}`
                      : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {enc.proposals.length === 0 ? (
                      <span style={{ color: "var(--text-tertiary)" }}>0</span>
                    ) : (
                      <span style={{ color: pendingCount > 0 ? "#FF9F0A" : "var(--text-secondary)" }}>
                        {enc.proposals.length}
                        {pendingCount > 0 && ` (${pendingCount} pendente${pendingCount > 1 ? "s" : ""})`}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit font-medium"
                      style={{ background: s.bg, color: s.color }}>
                      <Icon size={10} />{s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(enc.createdAt).toLocaleDateString("pt-BR")}
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
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSelected(null)} />
          <aside className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{ width: "min(520px,100vw)", background: "var(--surface-1)", borderLeft: "1px solid var(--border)" }}>

            {/* Header drawer */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
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
              {/* Status badge */}
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

              {/* Comprador */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-4 py-3" style={{ background: "var(--surface-2)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Comprador</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {selected.buyer.name}
                  </p>
                  {selected.buyer.discordId && (
                    <p className="text-xs mt-0.5" style={{ color: "#5865F2" }}>
                      Discord: {selected.buyer.discordId}
                    </p>
                  )}
                </div>
              </div>

              {/* Produto e detalhes */}
              <div className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>DETALHES DA ENCOMENDA</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Produto</span>
                    <span className="text-xs font-medium"
                      style={{ color: RARITY_COLORS[selected.product.rarity] ?? "var(--text-primary)" }}>
                      {selected.product.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Categoria</span>
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>{selected.product.category}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Raridade</span>
                    <span className="text-xs font-medium"
                      style={{ color: RARITY_COLORS[selected.product.rarity] ?? "var(--text-primary)" }}>
                      {selected.product.rarity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Quantidade</span>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      x{selected.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Preço máximo</span>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {selected.maxPrice != null
                        ? `R$ ${Number(selected.maxPrice).toFixed(2)}`
                        : <span style={{ color: "var(--text-tertiary)" }}>Não informado</span>}
                    </span>
                  </div>
                  {selected.note && (
                    <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Observação</p>
                      <p className="text-xs" style={{ color: "var(--text-primary)" }}>{selected.note}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposta aceita + pedido */}
              {(() => {
                const acc = acceptedProposal(selected)
                if (!acc) return null
                return (
                  <div className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: "rgba(48,209,88,0.06)", border: "1px solid rgba(48,209,88,0.2)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--success)" }}>PROPOSTA ACEITA</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Vendedor</span>
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {acc.seller.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Preço unitário</span>
                        <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>
                          R$ {Number(acc.price).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Total</span>
                        <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>
                          R$ {(Number(acc.price) * selected.quantity).toFixed(2)}
                        </span>
                      </div>
                      {acc.seller.discordId && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Discord vendedor</span>
                          <span className="text-xs" style={{ color: "#5865F2" }}>{acc.seller.discordId}</span>
                        </div>
                      )}
                      {acc.order && (
                        <div className="flex justify-between items-center pt-2"
                          style={{ borderTop: "1px solid rgba(48,209,88,0.15)" }}>
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Pedido</span>
                          <a href={`/admin/pedidos?id=${acc.order.id}`}
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{ color: "var(--accent)" }}
                            onClick={(e) => e.stopPropagation()}>
                            #{acc.order.id.slice(-8).toUpperCase()}
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                      {acc.order && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Status do pedido</span>
                          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                            {ORDER_STATUS_LABEL[acc.order.status] ?? acc.order.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Todas as propostas */}
              {selected.proposals.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <button
                    className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                    onClick={() => setExpanded(expanded === selected.id ? null : selected.id)}>
                    <span>TODAS AS PROPOSTAS ({selected.proposals.length})</span>
                    {expanded === selected.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {expanded === selected.id && (
                    <div className="flex flex-col">
                      {selected.proposals.map((p, i) => {
                        const ps = PROPOSAL_STYLE[p.status]
                        return (
                          <div key={p.id}
                            className="px-4 py-3 flex flex-col gap-1.5"
                            style={{
                              borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                              background: p.status === "ACEITA" ? "rgba(48,209,88,0.04)" : undefined,
                            }}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                                {p.seller.name}
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ color: ps.color, background: `${ps.color}18` }}>
                                {ps.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                Preço unitário
                              </span>
                              <span className="text-xs font-semibold" style={{ color: ps.color }}>
                                R$ {Number(p.price).toFixed(2)}
                              </span>
                            </div>
                            {p.note && (
                              <p className="text-xs italic" style={{ color: "var(--text-secondary)" }}>
                                "{p.note}"
                              </p>
                            )}
                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                              {new Date(p.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sem propostas */}
              {selected.proposals.length === 0 && selected.status === "ABERTA" && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
                  style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  <Clock size={13} /> Aguardando propostas dos vendedores
                </div>
              )}

              {/* Concluída */}
              {selected.status === "CONCLUIDA" && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(48,209,88,0.08)", color: "var(--success)", border: "1px solid rgba(48,209,88,0.2)" }}>
                  <CheckCircle size={15} /> Encomenda concluída com sucesso
                </div>
              )}

              {/* Cancelada */}
              {selected.status === "CANCELADA" && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(99,99,102,0.08)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  <XCircle size={15} /> Encomenda cancelada
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
