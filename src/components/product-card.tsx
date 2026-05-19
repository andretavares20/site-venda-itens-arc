"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/store/cart"
import { useState } from "react"

const rarityStyle: Record<string, { border: string; glow: string; gradient: string; label: string }> = {
  Common:    {
    border: "rgba(152,152,159,0.4)",
    glow: "rgba(152,152,159,0)",
    gradient: "rgba(152,152,159,0.15)",
    label: "#98989f",
  },
  Uncommon:  {
    border: "rgba(48,209,88,0.5)",
    glow: "rgba(48,209,88,0.15)",
    gradient: "rgba(48,209,88,0.2)",
    label: "#30d158",
  },
  Rare:      {
    border: "rgba(0,113,227,0.6)",
    glow: "rgba(0,113,227,0.2)",
    gradient: "rgba(0,113,227,0.25)",
    label: "#0071e3",
  },
  Epic:      {
    border: "rgba(191,90,242,0.65)",
    glow: "rgba(191,90,242,0.25)",
    gradient: "rgba(191,90,242,0.25)",
    label: "#bf5af2",
  },
  Legendary: {
    border: "rgba(255,214,10,0.7)",
    glow: "rgba(255,214,10,0.25)",
    gradient: "rgba(255,214,10,0.25)",
    label: "#ffd60a",
  },
}

type Props = {
  id: string
  name: string
  slug: string
  price: number
  image: string
  category: string
  rarity: string
  stock: number
  listingItemId?: string
  sellerId?: string
  sellerName?: string
}

export default function ProductCard({ id, name, slug, price, image, rarity, stock, listingItemId, sellerId, sellerName }: Props) {
  const add = useCart((s) => s.add)
  const [added, setAdded] = useState(false)
  const [hovered, setHovered] = useState(false)

  const rs = rarityStyle[rarity] ?? rarityStyle.Common
  const isBlueprint = slug.endsWith("_blueprint")

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (stock === 0) return
    add({ id: listingItemId ?? id, name, price, image, slug })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link
      href={`/produto/${slug}`}
      className="group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--surface-1)",
        border: `1px solid ${hovered ? rs.border : rs.border}`,
        boxShadow: hovered
          ? `0 0 20px ${rs.glow}, 0 8px 32px rgba(0,0,0,0.4)`
          : `0 0 8px ${rs.glow}`,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagem */}
      <div
        className="relative aspect-square overflow-hidden"
        style={isBlueprint ? {
          background: "#071428",
          backgroundImage: `
            linear-gradient(rgba(30,100,200,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,100,200,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        } : { background: "#0d0d0d" }}
      >
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradiente de raridade no canto inferior */}
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${rs.gradient}, transparent)`,
          }}
        />

        {/* Sem estoque */}
        {stock === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center text-sm font-medium"
            style={{ background: "rgba(0,0,0,0.75)", color: "var(--text-secondary)" }}
          >
            Sem estoque
          </div>
        )}

        {/* Badge raridade */}
        <div className="absolute top-2 right-2">
          <span
            className="text-xs px-2 py-0.5 rounded font-semibold tracking-wide"
            style={{
              background: "rgba(0,0,0,0.7)",
              color: rs.label,
              backdropFilter: "blur(8px)",
              border: `1px solid ${rs.border}`,
            }}
          >
            {rarity}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3">
        <h3
          className="font-medium text-xs leading-snug line-clamp-2"
          style={{ color: "var(--text-primary)" }}
        >
          {name}
        </h3>
        {sellerName && (
          <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
            por {sellerName}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            R$ {price.toFixed(2)}
          </span>
          <button
            onClick={handleAdd}
            disabled={stock === 0}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 transition-all"
            style={{
              background: added ? "var(--success)" : rs.border,
              color: added ? "#fff" : rs.label,
              border: `1px solid ${rs.border}`,
              opacity: stock === 0 ? 0.4 : 1,
              cursor: stock === 0 ? "not-allowed" : "pointer",
            }}
          >
            <ShoppingCart size={11} />
            {added ? "✓" : "+"}
          </button>
        </div>
      </div>
    </Link>
  )
}
