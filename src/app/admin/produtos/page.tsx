"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, X, Check, Search } from "lucide-react"
import Image from "next/image"

const rarityBorder: Record<string, string> = {
  Common:    "rgba(152,152,159,0.4)",
  Uncommon:  "rgba(48,209,88,0.5)",
  Rare:      "rgba(0,113,227,0.6)",
  Epic:      "rgba(191,90,242,0.65)",
  Legendary: "rgba(255,214,10,0.7)",
}

type Product = {
  id: string
  name: string
  slug: string
  description: string
  suggestedPrice: number
  image: string
  category: string
  rarity: string
  active: boolean
}

const empty: Omit<Product, "id" | "active"> = {
  name: "", slug: "", description: "", suggestedPrice: 0, image: "", category: "", rarity: "Common",
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default function AdminProdutos() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [rarityFilter, setRarityFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const filtered = products.filter((p) => {
    const matchName = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchRarity = !rarityFilter || p.rarity === rarityFilter
    const matchCategory = !categoryFilter || p.category === categoryFilter
    return matchName && matchRarity && matchCategory
  })

  const categories = [...new Set(products.map((p) => p.category))].sort()

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/produtos")
    const data = await res.json()
    setProducts(data)
  }

  function openNew() {
    setForm(empty)
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, slug: p.slug, description: p.description, suggestedPrice: p.suggestedPrice, image: p.image, category: p.category, rarity: p.rarity })
    setEditing(p.id)
    setShowForm(true)
  }

  async function handleSave() {
    setLoading(true)
    if (editing) {
      await fetch(`/api/produtos/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    } else {
      await fetch("/api/produtos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    }
    setShowForm(false)
    setEditing(null)
    setLoading(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Desativar este produto?")) return
    await fetch(`/api/produtos/${id}`, { method: "DELETE" })
    load()
  }

  function autoSlug(name: string) {
    return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Catálogo de itens
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
            {filtered.length}/{products.length}
          </span>
        </h1>
        <button onClick={openNew} className="btn-primary text-sm">
          <Plus size={16} /> Novo item
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--text-tertiary)" }}>
              <X size={13} />
            </button>
          )}
        </div>

        <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: rarityFilter ? rarityColor[rarityFilter] : "var(--text-secondary)", outline: "none" }}>
          <option value="">Todas raridades</option>
          {["Common", "Uncommon", "Rare", "Epic", "Legendary"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-sm px-3 py-2 rounded-xl"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-secondary)", outline: "none" }}>
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {(search || rarityFilter || categoryFilter) && (
          <button onClick={() => { setSearch(""); setRarityFilter(""); setCategoryFilter("") }}
            className="text-sm px-3 py-2 rounded-xl"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              {["Item", "Categoria", "Raridade", "Preço sugerido", "Ações"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                      style={p.slug?.endsWith("_blueprint") ? {
                        background: "#071428",
                        backgroundImage: "linear-gradient(rgba(30,100,200,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(30,100,200,0.15) 1px,transparent 1px)",
                        backgroundSize: "8px 8px",
                        border: `1px solid ${rarityBorder[p.rarity] ?? rarityBorder.Common}`,
                      } : {
                        background: "#0d0d0d",
                        border: `1px solid ${rarityBorder[p.rarity] ?? rarityBorder.Common}`,
                      }}>
                      {p.image && <Image src={p.image} alt={p.name} width={40} height={40} className="w-full h-full object-contain p-1" />}
                    </div>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{p.category}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium" style={{ color: rarityColor[p.rarity] ?? "#98989f" }}>{p.rarity}</span>
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                  R$ {Number(p.suggestedPrice).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-primary)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,69,58,0.1)"; e.currentTarget.style.color = "var(--error)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
            {products.length === 0 ? "Nenhum item no catálogo" : "Nenhum item corresponde aos filtros"}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {editing ? "Editar item" : "Novo item"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ color: "var(--text-secondary)" }}><X size={18} /></button>
            </div>

            {[
              { label: "Nome", key: "name", type: "text", onChangeFn: (v: string) => setForm((f) => ({ ...f, name: v, slug: autoSlug(v) })) },
              { label: "Slug (URL)", key: "slug", type: "text" },
              { label: "Imagem (URL)", key: "image", type: "url" },
              { label: "Categoria", key: "category", type: "text" },
              { label: "Preço sugerido (R$)", key: "suggestedPrice", type: "number" },
            ].map(({ label, key, type, onChangeFn }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</label>
                <input type={type} className="input-field text-sm"
                  value={String(form[key as keyof typeof form])}
                  onChange={(e) => onChangeFn ? onChangeFn(e.target.value) : setForm((f) => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                />
              </div>
            ))}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Raridade</label>
              <select className="input-field text-sm" value={form.rarity}
                onChange={(e) => setForm((f) => ({ ...f, rarity: e.target.value }))}>
                {["Common", "Uncommon", "Rare", "Epic", "Legendary"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Descrição</label>
              <textarea className="input-field text-sm resize-none" rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">
                <X size={14} /> Cancelar
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 text-sm">
                {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Check size={14} /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
