"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Navbar from "@/components/navbar"
import { Search, Plus, Trash2, CheckCircle, Info, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

type Product = {
  id: string
  name: string
  slug: string
  image: string
  category: string
  rarity: string
  suggestedPrice: number
}

type CartItem = {
  product: Product
  quantity: number
  price: number
}

type PriceHistory = { price: number; date: string }

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3",
  Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default function AnunciarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [hasPixKey, setHasPixKey] = useState<boolean | null>(null)
  const [rawQty, setRawQty] = useState<Record<string, string>>({})
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([])
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])
  const [history, setHistory] = useState<Record<string, PriceHistory[]>>({})

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/usuario/perfil")
      .then((r) => r.json())
      .then((data) => setHasPixKey(!!data.pixKey))
  }, [status])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/produtos?busca=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.slice(0, 12))
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function addItem(product: Product) {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id)
      if (exists) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1, price: product.suggestedPrice }]
    })
    setQuery("")
    setResults([])

    // Busca histórico de preços se ainda não tiver
    if (!history[product.id]) {
      const res = await fetch(`/api/produtos/${product.id}/historico`)
      const data = await res.json()
      setHistory((h) => ({ ...h, [product.id]: data }))
    }
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== id))
  }

  function updatePrice(id: string, price: number) {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, price } : i))
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { removeItem(id); return }
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i))
  }

  async function handleSubmit() {
    if (!cart.length) return
    setSubmitting(true)
    const res = await fetch("/api/anuncios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.price })),
      }),
    })
    if (res.ok) setDone(true)
    setSubmitting(false)
  }

  if (status === "loading" || status === "unauthenticated") return null

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center flex flex-col items-center gap-5 max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(48,209,88,0.1)" }}>
            <CheckCircle size={40} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Anúncio criado!</h1>
            <p style={{ color: "var(--text-secondary)" }}>
              A administração entrará em contato para retirar os itens in-game. Assim que recebermos, seu anúncio ficará visível na loja.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/minha-conta/anuncios" className="btn-primary text-sm">Ver meus anúncios</Link>
            <Link href="/" className="btn-secondary text-sm">Voltar à loja</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Criar anúncio</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Anuncie seus itens de Arc Raiders. Taxa de 10% sobre o valor vendido.
          </p>
        </div>

        {/* Aviso de chave PIX não configurada */}
        {hasPixKey === false && (
          <div
            className="flex items-start gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "rgba(255,214,10,0.08)", border: "1px solid rgba(255,214,10,0.25)" }}
          >
            <AlertCircle size={16} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="text-sm font-medium mb-0.5" style={{ color: "var(--warning)" }}>
                Chave PIX não configurada
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Configure sua chave PIX antes de anunciar para receber pagamentos quando seus itens forem vendidos.
              </p>
            </div>
            <Link
              href="/minha-conta/perfil"
              className="btn-primary text-xs flex-shrink-0"
              style={{ padding: "0.375rem 0.875rem" }}
            >
              Configurar
            </Link>
          </div>
        )}

        {/* Busca de itens */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Adicionar itens</h2>
          <div className="relative" ref={searchRef}>
            <div className="flex items-center gap-2 input-field" style={{ padding: "0.625rem 0.875rem" }}>
              <Search size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }}
                placeholder="Buscar item pelo nome..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {searching && <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />}
            </div>
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                {results.map((p) => (
                  <button key={p.id} onClick={() => addItem(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                      <Image src={p.image} alt={p.name} width={32} height={32} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      <p className="text-xs" style={{ color: rarityColor[p.rarity] ?? "#98989f" }}>{p.rarity} · {p.category}</p>
                    </div>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
                      Sugerido: R$ {Number(p.suggestedPrice).toFixed(2)}
                    </span>
                    <Plus size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lista de itens */}
        {cart.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid var(--border)" }}>
            <div className="px-5 py-3" style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Itens do anúncio ({cart.length})
              </span>
            </div>
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 px-5 py-3"
                style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                  <Image src={item.product.image} alt={item.product.name} width={40} height={40} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.product.name}</p>
                  <p className="text-xs mb-1" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>{item.product.rarity}</p>
                  {/* Mini gráfico de histórico */}
                  {(() => {
                    const h = history[item.product.id]
                    if (!h) return null
                    if (h.length === 0) return (
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Sem vendas anteriores</p>
                    )
                    const prices = h.map((v) => v.price)
                    const min = Math.min(...prices)
                    const max = Math.max(...prices)
                    const range = max - min || 1
                    const W = 120, H = 32
                    const pts = prices.map((p, i) => {
                      const x = (i / Math.max(prices.length - 1, 1)) * W
                      const y = H - ((p - min) / range) * H
                      return `${x},${y}`
                    }).join(" ")
                    const last = prices[prices.length - 1]
                    return (
                      <div className="flex items-end gap-2">
                        <svg width={W} height={H} style={{ overflow: "visible" }}>
                          <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5"
                            strokeLinejoin="round" strokeLinecap="round" />
                          {prices.map((p, i) => (
                            <circle key={i} cx={(i / Math.max(prices.length - 1, 1)) * W}
                              cy={H - ((p - min) / range) * H} r="2" fill="var(--accent)" />
                          ))}
                        </svg>
                        <div className="text-right">
                          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                            R$ {last.toFixed(2)}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            última venda
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Quantidade */}
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>−</button>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="bg-transparent outline-none text-center text-xs font-medium"
                      style={{ width: "36px", color: "var(--text-primary)" }}
                      value={rawQty[item.product.id] ?? String(item.quantity)}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, "")
                        setRawQty(r => ({ ...r, [item.product.id]: raw }))
                        const val = parseInt(raw)
                        if (!isNaN(val) && val > 0) updateQty(item.product.id, val)
                      }}
                      onBlur={e => {
                        const val = parseInt(e.target.value)
                        if (isNaN(val) || val <= 0) {
                          setRawQty(r => ({ ...r, [item.product.id]: String(item.quantity) }))
                        }
                      }}
                      onFocus={e => e.target.select()}
                    />
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-sm" style={{ color: "var(--text-secondary)" }}>+</button>
                  </div>

                  {/* Preços estilo Steam */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs w-24 text-right" style={{ color: "var(--text-secondary)" }}>Por unidade</span>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>R$</span>
                        <input
                          type="number" min="0" step="0.01"
                          className="bg-transparent outline-none text-sm text-right font-semibold"
                          style={{ width: "64px", color: "var(--text-primary)" }}
                          value={item.price}
                          onChange={(e) => updatePrice(item.product.id, Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs w-24 text-right" style={{ color: "var(--text-tertiary)" }}>Você recebe/un.</span>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>R$</span>
                        <input
                          type="number" min="0" step="0.01"
                          className="bg-transparent outline-none text-sm text-right"
                          style={{ width: "64px", color: "var(--success)" }}
                          value={(item.price * 0.9).toFixed(2)}
                          onChange={(e) => updatePrice(item.product.id, Number((Number(e.target.value) / 0.9).toFixed(2)))}
                        />
                      </div>
                    </div>
                    {item.product.suggestedPrice > 0 && (
                      <p className="text-xs text-right" style={{ color: "var(--text-tertiary)" }}>
                        Sugerido: R$ {Number(item.product.suggestedPrice).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <button onClick={() => removeItem(item.product.id)} style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--error)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: "var(--surface-1)" }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Info size={12} />
                Taxa de 10% descontada no momento do pagamento
              </div>
              <div className="text-right">
                <p className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Se vender tudo ({cart.reduce((s, i) => s + i.quantity, 0)} unid.)
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                  Você recebe: R$ {cart.reduce((s, i) => s + i.price * i.quantity * 0.9, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {hasPixKey === false && (
          <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
            Cadastre sua chave PIX em{" "}
            <a href="/minha-conta/perfil" style={{ color: "var(--accent)" }}>Meu perfil</a>{" "}
            para poder anunciar.
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!cart.length || submitting || hasPixKey === false}
          className="btn-primary w-full"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Criando anúncio...
            </span>
          ) : "Criar anúncio"}
        </button>
      </main>
    </div>
  )
}
