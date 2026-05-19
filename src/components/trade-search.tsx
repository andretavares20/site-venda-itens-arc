"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import Image from "next/image"

type Product = {
  id: string
  name: string
  image: string
  rarity: string
  category: string
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default function TradeSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue ?? "")
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/produtos?busca=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.slice(0, 10))
      setOpen(true)
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function select(product: Product) {
    setQuery(product.name)
    setOpen(false)
    router.push(`/trocas?busca=${encodeURIComponent(product.name)}`)
  }

  function clear() {
    setQuery("")
    setResults([])
    setOpen(false)
    router.push("/trocas")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && query.trim()) {
      setOpen(false)
      router.push(`/trocas?busca=${encodeURIComponent(query.trim())}`)
    }
    if (e.key === "Escape") { setOpen(false) }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <Search size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar item disponível para troca... ex: Bettina, Canto, Osprey"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "var(--text-primary)" }}
        />
        {searching && (
          <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
            style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
        )}
        {query && !searching && (
          <button onClick={clear} style={{ color: "var(--text-tertiary)" }}>
            <X size={15} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}
        >
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => select(p)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ borderBottom: "1px solid var(--border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                <Image src={p.image} alt={p.name} width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                <p className="text-xs" style={{ color: rarityColor[p.rarity] ?? "#98989f" }}>
                  {p.rarity} · {p.category}
                </p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                Ver trocas →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
