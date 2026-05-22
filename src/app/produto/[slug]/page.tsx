"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { useCart } from "@/store/cart"
import Image from "next/image"
import Link from "next/link"
import { Package, ArrowLeft, Shield, Zap, ShoppingCart, Star } from "lucide-react"

type Listing = {
  id: string
  listingItemId: string
  price: number
  quantity: number
  seller: { id: string; name: string }
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
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default function ProdutoPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const add = useCart((s) => s.add)

  const [product, setProduct] = useState<Product | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/produtos?slug=${slug}`).then((r) => r.json()),
      fetch(`/api/listing-items?slug=${slug}`).then((r) => r.json()),
    ]).then(([productData, listingData]) => {
      setProduct(productData)
      setListings(listingData ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slug])

  function handleAdd(listing: Listing) {
    if (!product) return
    add({
      id: listing.listingItemId,
      name: product.name,
      price: listing.price,
      image: product.image,
      slug: product.slug,
      stock: listing.quantity,
    })
    setAdded(listing.listingItemId)
    setTimeout(() => setAdded(null), 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Navbar />
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
        <Navbar />
        <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Item não encontrado</p>
        <button onClick={() => router.push("/")} className="btn-secondary">Voltar à loja</button>
      </div>
    )
  }

  const rarity = product.rarity
  const rc = rarityColor[rarity] ?? "#98989f"

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-5xl mx-auto">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Imagem */}
          <div className="relative aspect-square rounded-3xl overflow-hidden"
            style={{
              background: slug.endsWith("_blueprint") ? "#071428" : "#0d0d0d",
              backgroundImage: slug.endsWith("_blueprint")
                ? "linear-gradient(rgba(30,100,200,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(30,100,200,0.15) 1px,transparent 1px)"
                : undefined,
              backgroundSize: "24px 24px",
              border: `1px solid ${rc}40`,
              boxShadow: `0 0 40px ${rc}20`,
            }}>
            <Image src={product.image} alt={product.name} fill className="object-contain p-8" />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${rc}18`, color: rc }}>
                  {rarity}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  <Package size={10} className="inline mr-1" />{product.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                {product.name}
              </h1>
              <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {product.description}
              </p>
            </div>

            {/* Anúncios disponíveis */}
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                {listings.length > 0 ? `${listings.length} anúncio${listings.length > 1 ? "s" : ""} disponível${listings.length > 1 ? "s" : ""}` : "Sem anúncios no momento"}
              </h2>

              {listings.length === 0 ? (
                <div className="rounded-2xl p-6 text-center flex flex-col gap-3"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Nenhum vendedor está anunciando este item agora.
                  </p>
                  <Link href="/anunciar" className="btn-secondary text-sm">
                    Anunciar este item
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {listings.map((listing) => (
                    <div key={listing.listingItemId}
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Star size={11} style={{ color: "var(--warning)" }} />
                          <Link href={`/perfil/${listing.seller.id}`}
                            className="text-xs font-medium hover:underline"
                            style={{ color: "var(--text-secondary)" }}>
                            {listing.seller.name}
                          </Link>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {listing.quantity} unidade{listing.quantity > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                          R$ {listing.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleAdd(listing)}
                          className="btn-primary text-sm flex-shrink-0"
                          style={{
                            padding: "0.5rem 1rem",
                            background: added === listing.listingItemId ? "var(--success)" : undefined,
                          }}
                        >
                          <ShoppingCart size={14} />
                          {added === listing.listingItemId ? "Adicionado!" : "Comprar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Garantias */}
            <div className="flex flex-col gap-3 rounded-2xl p-4"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Zap size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                Entrega rápida após confirmação do PIX
              </div>
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Shield size={15} style={{ color: "var(--success)", flexShrink: 0 }} />
                Itens verificados pela administração
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
