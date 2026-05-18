"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { useCart } from "@/store/cart"
import Image from "next/image"
import { ShoppingCart, Package, ArrowLeft, Shield, Zap } from "lucide-react"

type Product = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image: string
  stock: number
  category: string
}

export default function ProdutoPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const add = useCart((s) => s.add)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    fetch(`/api/produtos?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  function handleAdd() {
    if (!product || product.stock === 0) return
    for (let i = 0; i < qty; i++) {
      add({ id: product.id, name: product.name, price: product.price, image: product.image, slug: product.slug })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Navbar />
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
        <Navbar />
        <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Produto não encontrado</p>
        <button onClick={() => router.push("/")} className="btn-secondary">Voltar à loja</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Imagem */}
          <div
            className="relative aspect-square rounded-3xl overflow-hidden"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            <div>
              <div
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-3"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <Package size={11} />
                {product.category}
              </div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
              >
                {product.name}
              </h1>
            </div>

            <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {product.description}
            </p>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: "var(--text-primary)" }}>
                R$ {product.price.toFixed(2)}
              </span>
            </div>

            {/* Quantidade */}
            <div className="flex items-center gap-4">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Quantidade</span>
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-lg transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  −
                </button>
                <span className="w-10 text-center font-medium" style={{ color: "var(--text-primary)" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-lg transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  +
                </button>
              </div>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {product.stock} disponíveis
              </span>
            </div>

            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="btn-primary w-full text-base"
              style={{ padding: "0.875rem", background: added ? "var(--success)" : undefined }}
            >
              <ShoppingCart size={18} />
              {added ? "Adicionado ao carrinho!" : product.stock === 0 ? "Sem estoque" : "Adicionar ao carrinho"}
            </button>

            {/* Garantias */}
            <div
              className="flex flex-col gap-3 rounded-2xl p-4"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Zap size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                Entrega rápida após confirmação do PIX
              </div>
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <Shield size={15} style={{ color: "var(--success)", flexShrink: 0 }} />
                Compra 100% segura
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
