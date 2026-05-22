"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Package, TrendingUp, ShoppingBag, Archive } from "lucide-react"

type StockItem = {
  id: string
  quantity: number
  price: number
  active: boolean
  product: {
    name: string
    image: string
    rarity: string
    category: string
    slug: string
  }
  listing: {
    status: string
  } | null
  createdAt: string
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3",
  Epic: "#bf5af2", Legendary: "#ffd60a",
}

const rarityBorder: Record<string, string> = {
  Common:    "rgba(152,152,159,0.4)",
  Uncommon:  "rgba(48,209,88,0.5)",
  Rare:      "rgba(0,113,227,0.6)",
  Epic:      "rgba(191,90,242,0.65)",
  Legendary: "rgba(255,214,10,0.7)",
}

function statusInfo(item: StockItem) {
  if (item.listing?.status === "CANCELAMENTO_SOLICITADO") {
    return { label: "Cancelamento pendente", color: "var(--warning)", bg: "rgba(255,214,10,0.1)" }
  }
  if (!item.active || item.quantity === 0) {
    return { label: "Esgotado", color: "var(--error)", bg: "rgba(255,69,58,0.1)" }
  }
  return { label: "Disponível", color: "var(--success)", bg: "rgba(48,209,88,0.1)" }
}

export default function MeuEstoquePage() {
  const { status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRarity, setFilterRarity] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/minha-conta/estoque")
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false) })
  }, [status])

  if (status === "loading" || status === "unauthenticated") return null

  const totalItens = items.reduce((s, i) => s + i.quantity, 0)
  const totalValor = items.filter(i => i.active).reduce((s, i) => s + i.price * i.quantity, 0)
  const disponiveis = items.filter(i => i.active && i.quantity > 0 && i.listing?.status !== "CANCELAMENTO_SOLICITADO").length

  const rarities = [...new Set(items.map(i => i.product.rarity))]

  const filtered = items.filter(i => {
    const matchRarity = !filterRarity || i.product.rarity === filterRarity
    const matchStatus = !filterStatus ||
      (filterStatus === "disponivel" && i.active && i.quantity > 0 && i.listing?.status !== "CANCELAMENTO_SOLICITADO") ||
      (filterStatus === "cancelamento" && i.listing?.status === "CANCELAMENTO_SOLICITADO") ||
      (filterStatus === "esgotado" && (!i.active || i.quantity === 0))
    return matchRarity && matchStatus
  })

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <Link href="/minha-conta" className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}>
          <ArrowLeft size={15} /> Minha conta
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Meu estoque</h1>
          <Link href="/anunciar" className="btn-primary text-sm">
            + Anunciar
          </Link>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => { setFilterRarity(""); setFilterStatus("") }}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: !filterRarity && !filterStatus ? "var(--accent)" : "var(--surface-2)", color: !filterRarity && !filterStatus ? "#fff" : "var(--text-secondary)" }}>
            Todos
          </button>
          {[
            { key: "disponivel", label: "Disponível", color: "var(--success)" },
            { key: "cancelamento", label: "Cancelamento pendente", color: "var(--warning)" },
            { key: "esgotado", label: "Esgotado", color: "var(--error)" },
          ].map(s => (
            <button key={s.key} onClick={() => setFilterStatus(filterStatus === s.key ? "" : s.key)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: filterStatus === s.key ? `${s.color}22` : "var(--surface-2)",
                color: filterStatus === s.key ? s.color : "var(--text-secondary)",
                border: `1px solid ${filterStatus === s.key ? `${s.color}44` : "transparent"}`,
              }}>
              {s.label}
            </button>
          ))}
          <div className="w-px mx-1" style={{ background: "var(--border)" }} />
          {rarities.map(r => (
            <button key={r} onClick={() => setFilterRarity(filterRarity === r ? "" : r)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: filterRarity === r ? `${rarityColor[r] ?? "#98989f"}22` : "var(--surface-2)",
                color: filterRarity === r ? rarityColor[r] ?? "#98989f" : "var(--text-secondary)",
                border: `1px solid ${filterRarity === r ? `${rarityColor[r] ?? "#98989f"}44` : "transparent"}`,
              }}>
              {r}
            </button>
          ))}
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Archive, label: "Itens disponíveis", value: disponiveis, color: "var(--success)" },
            { icon: Package, label: "Unidades em estoque", value: totalItens, color: "var(--accent)" },
            { icon: TrendingUp, label: "Valor em estoque", value: `R$ ${totalValor.toFixed(2)}`, color: "var(--warning)" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <Icon size={16} style={{ color }} />
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 rounded-2xl text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <ShoppingBag size={40} style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Você ainda não tem itens no estoque</p>
            <Link href="/anunciar" className="btn-primary text-sm">Anunciar item</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(item => {
              const s = statusInfo(item)
              return (
                <div key={item.id} className="rounded-2xl overflow-hidden flex flex-col"
                  style={{ background: "var(--surface-1)", border: `1px solid ${rarityBorder[item.product.rarity] ?? "var(--border)"}` }}>

                  {/* Imagem */}
                  <div className="relative aspect-square" style={{ background: "#0d0d0d" }}>
                    <Image src={item.product.image} alt={item.product.name}
                      fill className="object-contain p-3" />
                    {/* Badge status */}
                    <div className="absolute top-2 left-2">
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color, fontSize: "10px" }}>
                        {item.quantity > 0 ? `${item.quantity} un.` : "Esgotado"}
                      </span>
                    </div>
                    {/* Badge raridade */}
                    <div className="absolute top-2 right-2">
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: "rgba(0,0,0,0.7)",
                          color: rarityColor[item.product.rarity] ?? "#98989f",
                          fontSize: "10px",
                        }}>
                        {item.product.rarity}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1" style={{ minHeight: "72px" }}>
                    <p className="text-xs font-medium line-clamp-2 flex-1"
                      style={{ color: "var(--text-primary)" }}>
                      {item.product.name}
                    </p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      R$ {Number(item.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
