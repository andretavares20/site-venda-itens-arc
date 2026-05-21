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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

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
          <div className="flex flex-col gap-3">
            {items.map(item => {
              const s = statusInfo(item)
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                    <Image src={item.product.image} alt={item.product.name}
                      width={48} height={48} className="w-full h-full object-contain" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {item.product.name}
                      </p>
                      <span className="text-xs font-medium flex-shrink-0"
                        style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>
                        {item.product.rarity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {item.product.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      R$ {Number(item.price).toFixed(2)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {item.quantity} un. em estoque
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
