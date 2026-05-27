"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import DiscordGate from "@/components/discord-gate"
import { Search, Plus, Trash2, CheckCircle, ArrowLeftRight, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type Product = { id: string; name: string; image: string; rarity: string; category: string }
type Item = { product: Product; quantity: number }

type RecentTroca = {
  id: string
  status: string
  createdAt: string
  offerItems: { product: { name: string; image: string } }[]
  proposals: { id: string }[]
}

const TROCA_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  ABERTA:                   { label: "Aberta",     bg: "rgba(48,209,88,0.1)",   color: "var(--success)"       },
  AGUARDANDO_CONFIRMACAO:   { label: "Aguardando", bg: "rgba(255,214,10,0.1)", color: "var(--warning)"       },
  CONCLUIDA:                { label: "Concluída",  bg: "rgba(0,113,227,0.1)",  color: "var(--accent)"        },
  CANCELADA:                { label: "Cancelada",  bg: "var(--surface-2)",     color: "var(--text-tertiary)" },
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

function ItemSearch({ label, items, setItems }: {
  label: string
  items: Item[]
  setItems: (fn: (prev: Item[]) => Item[]) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/produtos?busca=${encodeURIComponent(query)}`)
      setResults((await res.json()).slice(0, 8))
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function add(product: Product) {
    setItems((prev) => {
      const exists = prev.find((i) => i.product.id === product.id)
      if (exists) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
    setQuery(""); setResults([])
  }

  function remove(id: string) { setItems((prev) => prev.filter((i) => i.product.id !== id)) }

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{label}</h2>
      <div className="relative mb-3">
        <div className="flex items-center gap-2 input-field" style={{ padding: "0.625rem 0.875rem" }}>
          <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }}
            placeholder="Buscar item..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {searching && <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
            style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />}
        </div>
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {results.map((p) => (
              <button key={p.id} onClick={() => add(p)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                  <Image src={p.image} alt={p.name} width={28} height={28} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: rarityColor[p.rarity] ?? "#98989f" }}>{p.rarity}</p>
                </div>
                <Plus size={14} style={{ color: "var(--accent)" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                <Image src={item.product.image} alt={item.product.name} width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.product.name}</p>
                <p className="text-xs" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>{item.product.rarity}</p>
              </div>
              <div className="flex items-center rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid var(--border)" }}>
                <button onClick={() => setItems((p) => p.map((i) => i.product.id === item.product.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                  className="w-7 h-7 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>−</button>
                <span className="w-7 text-center text-xs" style={{ color: "var(--text-primary)" }}>{item.quantity}</span>
                <button onClick={() => setItems((p) => p.map((i) => i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i))}
                  className="w-7 h-7 flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>+</button>
              </div>
              <button onClick={() => remove(item.product.id)} style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--error)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-center py-4 rounded-xl"
          style={{ color: "var(--text-tertiary)", background: "var(--surface-1)", border: "1px dashed var(--border)" }}>
          Nenhum item adicionado
        </p>
      )}
    </div>
  )
}

export default function NovaTrocaPage() {
  const { status } = useSession()
  const router = useRouter()
  const [offerItems, setOfferItems] = useState<Item[]>([])
  const [wantItems, setWantItems] = useState<Item[]>([])
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [recentTrocas, setRecentTrocas] = useState<RecentTroca[]>([])

  useEffect(() => { if (status === "unauthenticated") router.push("/login") }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/trocas?mine=1")
      .then((r) => r.json())
      .then((data) => setRecentTrocas(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {})
  }, [status])

  async function handleSubmit() {
    if (!offerItems.length) return
    setSubmitting(true)
    const res = await fetch("/api/trocas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerItems: offerItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        wantItems: wantItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        note: note || null,
      }),
    })
    if (res.ok) setDone(true)
    setSubmitting(false)
  }

  if (status === "loading" || status === "unauthenticated") return null

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="text-center flex flex-col items-center gap-5 max-w-sm">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(48,209,88,0.1)" }}>
          <CheckCircle size={40} style={{ color: "var(--success)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Troca publicada!</h1>
          <p style={{ color: "var(--text-secondary)" }}>Seu anúncio está visível para outros jogadores.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/trocas" className="btn-primary text-sm">Ver trocas</Link>
          <Link href="/minha-conta/trocas" className="btn-secondary text-sm">Minhas trocas</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <DiscordGate>
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Anunciar troca</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Gratuito — troca direta entre jogadores</p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <ItemSearch label="Itens que você oferece *" items={offerItems} setItems={setOfferItems} />
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <div className="flex items-center justify-center w-9 h-9 rounded-full"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <ArrowLeftRight size={16} style={{ color: "var(--text-tertiary)" }} />
            </div>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <div className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <ItemSearch
              label="Itens que você quer receber (opcional — deixe vazio para aceitar qualquer proposta)"
              items={wantItems}
              setItems={setWantItems}
            />
          </div>

          <div className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Observação (opcional)
            </h2>
            <textarea className="input-field text-sm resize-none" rows={3}
              placeholder="Ex: prefiro trocar com jogadores ativos, item sobrando do inventário..."
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <button onClick={handleSubmit} disabled={!offerItems.length || submitting} className="btn-primary w-full">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Publicando...
              </span>
            ) : "Publicar troca"}
          </button>
        </div>

        {/* Últimas trocas */}
        {recentTrocas.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                SUAS ÚLTIMAS TROCAS
              </p>
              <Link href="/minha-conta/trocas" className="text-xs" style={{ color: "var(--accent)" }}>
                Ver todas →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentTrocas.map((t) => {
                const badge = TROCA_STATUS[t.status] ?? { label: t.status, bg: "var(--surface-2)", color: "var(--text-tertiary)" }
                const firstItem = t.offerItems[0]
                return (
                  <Link key={t.id} href={`/trocas/${t.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    {firstItem && (
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                        <Image src={firstItem.product.image} alt={firstItem.product.name} width={36} height={36} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {t.offerItems.map((i) => i.product.name).join(", ")}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                        {t.proposals.length > 0 && ` · ${t.proposals.length} proposta${t.proposals.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>
      </DiscordGate>
    </div>
  )
}
