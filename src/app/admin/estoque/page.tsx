"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Search, X } from "lucide-react"

type StockItem = {
  id: string
  quantity: number
  price: number
  active: boolean
  product: { id: string; name: string; image: string; rarity: string; category: string; slug: string }
  seller: { id: string; name: string; email: string }
  createdAt: string
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default function AdminEstoque() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/admin/estoque")
    setItems(await res.json())
    setLoading(false)
  }

  async function updateQty(id: string, quantity: number) {
    setUpdating(id)
    await fetch(`/api/admin/estoque/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    })
    setUpdating(null)
    load()
  }

  async function toggleActive(id: string, active: boolean) {
    setUpdating(id)
    await fetch(`/api/admin/estoque/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    setUpdating(null)
    load()
  }

  const filtered = items.filter(i =>
    !search ||
    i.product.name.toLowerCase().includes(search.toLowerCase()) ||
    i.seller.name.toLowerCase().includes(search.toLowerCase())
  )

  const total = items.reduce((s, i) => s + i.quantity, 0)
  const ativos = items.filter(i => i.active && i.quantity > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Estoque</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {ativos} itens disponíveis · {total} unidades no total
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)", maxWidth: "400px" }}>
        <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text-primary)" }}
          placeholder="Buscar por item ou vendedor..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch("")} style={{ color: "var(--text-tertiary)" }}><X size={13} /></button>}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              {["Item", "Vendedor", "Categoria", "Raridade", "Preço", "Quantidade", "Status", "Ações"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Nenhum item no estoque</td></tr>
            ) : filtered.map((item, i) => (
              <tr key={item.id}
                style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)", opacity: item.active ? 1 : 0.5 }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                      <Image src={item.product.image} alt={item.product.name} width={40} height={40} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>{item.product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs" style={{ color: "var(--text-primary)" }}>{item.seller.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{item.seller.email}</p>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{item.product.category}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>
                    {item.product.rarity}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  R$ {Number(item.price).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id, Math.max(0, item.quantity - 1))}
                      disabled={updating === item.id}
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>−</button>
                    <span className="w-8 text-center text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {item.quantity}
                    </span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>+</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: item.active && item.quantity > 0 ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)",
                      color: item.active && item.quantity > 0 ? "var(--success)" : "var(--error)",
                    }}>
                    {item.active && item.quantity > 0 ? "Disponível" : "Indisponível"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(item.id, !item.active)}
                    disabled={updating === item.id}
                    className="text-xs px-3 py-1 rounded-full transition-colors"
                    style={{
                      color: item.active ? "var(--error)" : "var(--success)",
                      border: `1px solid ${item.active ? "rgba(255,69,58,0.3)" : "rgba(48,209,88,0.3)"}`,
                    }}>
                    {item.active ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
