"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { CheckCircle, Clock, X } from "lucide-react"

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
  PENDENTE_ENTREGA: "Pendente entrega",
  DISPONIVEL: "Disponível",
  PARCIALMENTE_VENDIDO: "Parcialmente vendido",
  VENDIDO: "Vendido",
  CANCELAMENTO_SOLICITADO: "Cancelamento — aguardando devolução",
  CANCELADO: "Cancelado",
}

export default function AdminAnunciosPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("PENDENTE_ENTREGA")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { load() }, [])

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

  const filtered = listings.filter((l) => filter === "TODOS" || l.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Anúncios</h1>
        <div className="flex items-center gap-2">
          {["PENDENTE_ENTREGA", "DISPONIVEL", "CANCELAMENTO_SOLICITADO", "VENDIDO", "CANCELADO", "TODOS"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={{
                background: filter === s ? "var(--accent)" : "var(--surface-2)",
                color: filter === s ? "#fff" : "var(--text-secondary)",
              }}>
              {statusLabel[s] ?? s}
              {s !== "TODOS" && (
                <span className="ml-1.5">({listings.filter((l) => l.status === s).length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((listing) => (
            <div key={listing.id} className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
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

              {/* Ações — cancelamento solicitado: botão de devolução */}
              {listing.status === "CANCELAMENTO_SOLICITADO" && (
                <div className="px-5 py-3 flex items-center gap-3" style={{ background: "rgba(255,214,10,0.05)", borderTop: "1px solid var(--border)" }}>
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--warning)" }}>
                      Vendedor solicitou cancelamento via Discord
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      Após devolver o item in-game, clique no botão ao lado.
                    </p>
                  </div>
                  <button
                    onClick={() => updateStatus(listing.id, "CANCELADO")}
                    disabled={updating === listing.id}
                    className="btn-primary text-sm flex-shrink-0"
                    style={{ background: "var(--success)" }}
                  >
                    {updating === listing.id ? "Processando..." : "✓ Item devolvido"}
                  </button>
                </div>
              )}

              {/* Ações admin */}
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
                    {updating === listing.id ? "Salvando..." : "Item recebido — Publicar"}
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
              Nenhum anúncio nesta categoria
            </div>
          )}
        </div>
      )}
    </div>
  )
}
