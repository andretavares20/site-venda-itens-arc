"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import DiscordGate from "@/components/discord-gate"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"

type Product = { id: string; name: string; image: string; category: string; rarity: string }

type RecentEncomenda = {
  id: string
  status: string
  createdAt: string
  quantity: number
  maxPrice: number | null
  buyer: { name: string }
  product: { name: string; image: string }
  proposals: { id: string }[]
}


const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

const rarityStyle: Record<string, { border: string; glow: string }> = {
  Common:    { border: "rgba(152,152,159,0.4)", glow: "rgba(152,152,159,0)" },
  Uncommon:  { border: "rgba(48,209,88,0.5)",   glow: "rgba(48,209,88,0.1)" },
  Rare:      { border: "rgba(0,113,227,0.6)",   glow: "rgba(0,113,227,0.1)" },
  Epic:      { border: "rgba(191,90,242,0.65)", glow: "rgba(191,90,242,0.1)" },
  Legendary: { border: "rgba(255,214,10,0.7)",  glow: "rgba(255,214,10,0.12)" },
}

export default function NovaEncomendaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [maxPrice, setMaxPrice] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [recentEncomendas, setRecentEncomendas] = useState<RecentEncomenda[]>([])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/encomendas")
      .then((r) => r.json())
      .then((data) => setRecentEncomendas(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {})
  }, [status])

  useEffect(() => {
    fetch("/api/produtos")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : data.products ?? []))
  }, [])

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  async function submit() {
    if (!selected) { setError("Selecione um produto."); return }
    if (quantity < 1) { setError("Quantidade inválida."); return }
    setLoading(true)
    setError("")

    const res = await fetch("/api/encomendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selected.id,
        quantity,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        note: note || undefined,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      router.push(`/encomendas/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? "Erro ao criar encomenda.")
      setLoading(false)
    }
  }

  if (status === "loading" || status === "unauthenticated") return null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <DiscordGate>
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Nova encomenda
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          Publique o que você precisa e vendedores vão propor um preço.
        </p>

        <div className="flex flex-col gap-6">
          {/* Seleção de produto */}
          <div className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Qual item você precisa?
            </h2>

            {selected ? (
              <div className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                  style={{
                    background: "#0d0d0d",
                    border: `1px solid ${rarityStyle[selected.rarity]?.border ?? rarityStyle.Common.border}`,
                    boxShadow: `0 0 8px ${rarityStyle[selected.rarity]?.glow ?? "transparent"}`,
                  }}>
                  <Image src={selected.image} alt={selected.name} width={40} height={40}
                    className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{selected.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{selected.category}</p>
                    <p className="text-xs font-medium" style={{ color: rarityColor[selected.rarity] ?? "#98989f" }}>{selected.rarity}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)}
                  className="text-xs" style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <Search size={14} style={{ color: "var(--text-tertiary)" }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar no catálogo..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "var(--text-primary)" }} />
                </div>
                {search && (
                  <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                    {filtered.slice(0, 10).map((p) => (
                      <button key={p.id} onClick={() => { setSelected(p); setSearch("") }}
                        className="flex items-center gap-3 p-2 rounded-xl text-left transition-colors"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
                          style={{
                            background: "#0d0d0d",
                            border: `1px solid ${rarityStyle[p.rarity]?.border ?? rarityStyle.Common.border}`,
                            boxShadow: `0 0 8px ${rarityStyle[p.rarity]?.glow ?? "transparent"}`,
                          }}>
                          <Image src={p.image} alt={p.name} width={36} height={36}
                            className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{p.category}</p>
                            <p className="text-xs font-medium" style={{ color: rarityColor[p.rarity] ?? "#98989f" }}>{p.rarity}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
                        Nenhum produto encontrado
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quantidade e preço */}
          <div className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Quantidade
              </label>
              <input type="number" min={1} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field w-32" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Preço máximo que topa pagar <span style={{ color: "var(--text-tertiary)" }}>(opcional)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>R$</span>
                <input type="number" min={0} step={0.01} value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Ex: 50,00"
                  className="input-field w-40" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Observação <span style={{ color: "var(--text-tertiary)" }}>(opcional)</span>
              </label>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Preciso com urgência, aceito qualquer quantidade acima de 5..."
                className="input-field resize-none" />
            </div>
          </div>

          {error && (
            <p className="text-sm px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)", border: "1px solid rgba(255,69,58,0.2)" }}>
              {error}
            </p>
          )}

          <button onClick={submit} disabled={loading || !selected} className="btn-primary w-full">
            {loading ? "Publicando..." : "Publicar encomenda"}
          </button>
        </div>

        {/* Encomendas abertas recentes do site */}
        {recentEncomendas.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                ENCOMENDAS ABERTAS
              </p>
              <Link href="/encomendas" className="text-xs" style={{ color: "var(--accent)" }}>
                Ver todas →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentEncomendas.map((e) => (
                <Link key={e.id} href={`/encomendas/${e.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                    <Image src={e.product.image} alt={e.product.name} width={36} height={36} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {e.product.name}
                      {e.quantity > 1 && <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>×{e.quantity}</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {e.buyer.name}
                      {e.proposals.length > 0 && ` · ${e.proposals.length} proposta${e.proposals.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  {e.maxPrice != null && (
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--warning)" }}>
                      até R$ {Number(e.maxPrice).toFixed(2)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      </DiscordGate>
    </div>
  )
}
