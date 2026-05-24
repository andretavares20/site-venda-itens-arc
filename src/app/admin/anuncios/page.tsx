"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { CheckCircle, X } from "lucide-react"

type ListingItem = {
  id: string
  quantity: number
  price: number
  product: { name: string; image: string; rarity: string }
}

type Listing = {
  id: string
  status: string
  adminNotes: string | null
  createdAt: string
  seller: { id: string; name: string; email: string }
  items: ListingItem[]
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

const statusLabel: Record<string, string> = {
  PENDENTE_ENTREGA: "Pendente aprovação",
  DISPONIVEL: "Disponível",
  PARCIALMENTE_VENDIDO: "Parcialmente vendido",
  VENDIDO: "Vendido",
  CANCELAMENTO_SOLICITADO: "Cancelamento solicitado",
  CANCELADO: "Cancelado",
}

type Tab = {
  key: string
  label: string
  statuses: string[]
  accent: string
  urgent?: boolean
}

const TABS: Tab[] = [
  { key: "pendentes",      label: "Pendentes",             statuses: ["PENDENTE_ENTREGA"],                       accent: "#0071e3", urgent: true },
  { key: "ativos",         label: "Ativos",                statuses: ["DISPONIVEL", "PARCIALMENTE_VENDIDO"],     accent: "#30d158" },
  { key: "cancelamentos",  label: "Cancelamentos",         statuses: ["CANCELAMENTO_SOLICITADO"],                accent: "#ffd60a", urgent: true },
  { key: "concluidos",     label: "Concluídos",            statuses: ["VENDIDO", "CANCELADO"],                   accent: "#98989f" },
  { key: "todos",          label: "Todos",                 statuses: [],                                          accent: "var(--text-secondary)" },
]

export default function AdminAnunciosPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pendentes")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const highlightId = searchParams.get("listing")
  const highlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [listings])

  async function load() {
    const res = await fetch("/api/anuncios")
    const data = await res.json()
    setListings(data)
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/anuncios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes[id] }),
    })
    setUpdating(null)
    load()
  }

  function countTab(tab: Tab) {
    if (!tab.statuses.length) return listings.length
    return listings.filter((l) => tab.statuses.includes(l.status)).length
  }

  const currentTab = TABS.find((t) => t.key === activeTab)!
  const filtered = currentTab.statuses.length
    ? listings.filter((l) => currentTab.statuses.includes(l.status))
    : listings

  const summaryCards = [
    { label: "Aguardando aprovação",   count: listings.filter((l) => l.status === "PENDENTE_ENTREGA").length,            color: "#0071e3", bg: "rgba(0,113,227,0.08)" },
    { label: "No ar",                 count: listings.filter((l) => ["DISPONIVEL","PARCIALMENTE_VENDIDO"].includes(l.status)).length, color: "#30d158", bg: "rgba(48,209,88,0.08)" },
    { label: "Cancelamento pendente", count: listings.filter((l) => l.status === "CANCELAMENTO_SOLICITADO").length,     color: "#ffd60a", bg: "rgba(255,214,10,0.08)" },
    { label: "Concluídos",            count: listings.filter((l) => ["VENDIDO","CANCELADO"].includes(l.status)).length, color: "#98989f", bg: "rgba(152,152,159,0.08)" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Anúncios</h1>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl px-4 py-3"
              style={{ background: card.bg, border: `1px solid ${card.color}22` }}>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.count}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {TABS.map((tab) => {
          const count = countTab(tab)
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: isActive ? tab.accent : "var(--text-secondary)",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? `2px solid ${tab.accent}` : "2px solid transparent",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
              {count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: isActive ? tab.accent : tab.urgent && count > 0 ? tab.accent + "22" : "var(--surface-2)",
                    color: isActive ? "#fff" : tab.urgent && count > 0 ? tab.accent : "var(--text-tertiary)",
                  }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((listing) => (
            <div key={listing.id}
              ref={listing.id === highlightId ? highlightRef : null}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--surface-1)",
                border: listing.id === highlightId ? "2px solid var(--accent)" : "1px solid var(--border)",
              }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                    #{listing.id.slice(-8).toUpperCase()}
                  </span>
                  <span className="ml-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {listing.seller.name} · {listing.seller.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(listing.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                    {statusLabel[listing.status]}
                  </span>
                </div>
              </div>

              {/* Items */}
              {listing.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                    <Image src={item.product.image} alt={item.product.name}
                      width={40} height={40} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.product.name}</p>
                    <p className="text-xs" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>
                      {item.product.rarity} · x{item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    R$ {Number(item.price).toFixed(2)}
                  </span>
                </div>
              ))}

              {/* Ação — cancelamento solicitado */}
              {listing.status === "CANCELAMENTO_SOLICITADO" && (
                <div className="px-5 py-3 flex items-center gap-3"
                  style={{ background: "rgba(255,214,10,0.04)", borderTop: "1px solid var(--border)" }}>
                  <p className="flex-1 text-xs font-medium" style={{ color: "var(--warning)" }}>
                    Vendedor solicitou cancelamento
                  </p>
                  <button
                    onClick={() => updateStatus(listing.id, "CANCELADO")}
                    disabled={updating === listing.id}
                    className="btn-primary text-sm flex-shrink-0"
                    style={{ background: "var(--success)" }}
                  >
                    {updating === listing.id ? "Processando..." : "✓ Confirmar cancelamento"}
                  </button>
                </div>
              )}

              {/* Ação — pendente aprovação */}
              {listing.status === "PENDENTE_ENTREGA" && (
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: "var(--surface-1)" }}>
                  <input
                    className="input-field text-sm flex-1"
                    placeholder="Observação para o vendedor (opcional)"
                    value={notes[listing.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [listing.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => updateStatus(listing.id, "DISPONIVEL")}
                    disabled={updating === listing.id}
                    className="btn-primary text-sm flex-shrink-0"
                  >
                    <CheckCircle size={14} />
                    {updating === listing.id ? "Salvando..." : "Aprovar e publicar"}
                  </button>
                  <button
                    onClick={() => updateStatus(listing.id, "CANCELADO")}
                    disabled={updating === listing.id}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full flex-shrink-0"
                    style={{ color: "var(--error)", border: "1px solid rgba(255,69,58,0.3)" }}
                  >
                    <X size={14} /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
              Nenhum anúncio nesta categoria.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
