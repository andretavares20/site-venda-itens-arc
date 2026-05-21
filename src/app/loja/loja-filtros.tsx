"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { Search, X } from "lucide-react"

const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
const RARITY_COLOR: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3",
  Epic: "#bf5af2", Legendary: "#ffd60a",
}

interface Props {
  categories: string[]
  initialRarity?: string
  initialCategory?: string
  initialBusca?: string
}

export default function LojaFiltros({ categories, initialRarity = "", initialCategory = "", initialBusca = "" }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [busca, setBusca] = useState(initialBusca)
  const [raridade, setRaridade] = useState(initialRarity)
  const [categoria, setCategoria] = useState(initialCategory)
  const [rarityOpen, setRarityOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const rarityRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)

  function applyFilters(overrides: Partial<{ busca: string; raridade: string; categoria: string }>) {
    const next = {
      busca: overrides.busca !== undefined ? overrides.busca : busca,
      raridade: overrides.raridade !== undefined ? overrides.raridade : raridade,
      categoria: overrides.categoria !== undefined ? overrides.categoria : categoria,
    }
    const params = new URLSearchParams()
    if (next.busca) params.set("busca", next.busca)
    if (next.raridade) params.set("raridade", next.raridade)
    if (next.categoria) params.set("categoria", next.categoria)
    startTransition(() => {
      router.push(`/loja${params.size ? `?${params}` : ""}`)
    })
  }

  function clearAll() {
    setBusca("")
    setRaridade("")
    setCategoria("")
    startTransition(() => router.push("/loja"))
  }

  const hasFilter = busca || raridade || categoria

  return (
    <div className="flex flex-wrap gap-3">
      {/* Busca */}
      <div
        className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text-primary)" }}
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === "Enter" && applyFilters({ busca })}
        />
        {busca && (
          <button onClick={() => { setBusca(""); applyFilters({ busca: "" }) }} style={{ color: "var(--text-tertiary)" }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Raridade */}
      <div className="relative" ref={rarityRef}>
        <button
          onClick={() => { setRarityOpen(v => !v); setCategoryOpen(false) }}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl min-w-40"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: raridade ? RARITY_COLOR[raridade] : "var(--text-secondary)",
          }}
        >
          <span className="flex-1 text-left">{raridade || "Todas raridades"}</span>
          <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>▾</span>
        </button>
        {rarityOpen && (
          <div
            className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20 min-w-40"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
          >
            {["", ...RARITIES].map(r => (
              <button
                key={r}
                onClick={() => { setRaridade(r); applyFilters({ raridade: r }); setRarityOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{
                  color: r ? RARITY_COLOR[r] : "var(--text-secondary)",
                  background: raridade === r ? "var(--surface-2)" : "transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = raridade === r ? "var(--surface-2)" : "transparent")}
              >
                {r || "Todas raridades"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Categoria */}
      <div className="relative" ref={categoryRef}>
        <button
          onClick={() => { setCategoryOpen(v => !v); setRarityOpen(false) }}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl min-w-44"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <span className="flex-1 text-left">{categoria || "Todas categorias"}</span>
          <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>▾</span>
        </button>
        {categoryOpen && (
          <div
            className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20 min-w-44 max-h-64 overflow-y-auto"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
          >
            {["", ...categories].map(c => (
              <button
                key={c}
                onClick={() => { setCategoria(c); applyFilters({ categoria: c }); setCategoryOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm transition-colors"
                style={{
                  color: "var(--text-secondary)",
                  background: categoria === c ? "var(--surface-2)" : "transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = categoria === c ? "var(--surface-2)" : "transparent")}
              >
                {c || "Todas categorias"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Limpar */}
      {hasFilter && (
        <button
          onClick={clearAll}
          className="text-sm px-3 py-2 rounded-xl transition-colors"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border)", background: "var(--surface-2)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
