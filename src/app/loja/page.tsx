import Navbar from "@/components/navbar"
import ProductCard from "@/components/product-card"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus } from "lucide-react"
import Footer from "@/components/footer"
import LojaFiltros from "./loja-filtros"

async function getStockItems(category?: string, busca?: string, rarity?: string) {
  const stocks = await prisma.stock.findMany({
    where: {
      active: true,
      quantity: { gt: 0 },
      product: {
        active: true,
        ...(category ? { category } : {}),
        ...(rarity ? { rarity } : {}),
        ...(busca ? { name: { contains: busca, mode: "insensitive" } } : {}),
      },
    },
    include: {
      product: true,
      seller: { select: { tier: true } },
    },
    orderBy: { price: "asc" },
  })

  // Agrupa por produto — um card por produto único
  const grouped = new Map<string, {
    stockId: string
    product: typeof stocks[0]["product"]
    totalQty: number
    prices: number[]
    hasVerifiedTrader: boolean
  }>()

  for (const stock of stocks) {
    if (!grouped.has(stock.productId)) {
      grouped.set(stock.productId, {
        stockId: stock.id,
        product: stock.product,
        totalQty: 0,
        prices: [],
        hasVerifiedTrader: false,
      })
    }
    const g = grouped.get(stock.productId)!
    g.totalQty += stock.quantity
    g.prices.push(Number(stock.price))
    if (stock.seller.tier === "VERIFIED_TRADER") g.hasVerifiedTrader = true
  }

  const RARITY_ORDER: Record<string, number> = {
    Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4,
  }

  return Array.from(grouped.values())
    .map(g => ({
      stockId: g.stockId,
      product: g.product,
      quantity: g.totalQty,
      avgPrice: g.prices.reduce((a, b) => a + b, 0) / g.prices.length,
      minPrice: Math.min(...g.prices),
      hasVerifiedTrader: g.hasVerifiedTrader,
    }))
    .sort((a, b) => {
      const rarityDiff = (RARITY_ORDER[a.product.rarity] ?? 5) - (RARITY_ORDER[b.product.rarity] ?? 5)
      if (rarityDiff !== 0) return rarityDiff
      // Dentro da mesma raridade: Verified Traders primeiro
      return (b.hasVerifiedTrader ? 1 : 0) - (a.hasVerifiedTrader ? 1 : 0)
    })
}

async function getCategories() {
  const result = await prisma.product.groupBy({
    by: ["category"],
    where: { active: true },
  })
  return result.map((r: { category: string }) => r.category).sort()
}

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string; raridade?: string }>
}) {
  const params = await searchParams
  const [stockItems, categories] = await Promise.all([
    getStockItems(params.categoria, params.busca, params.raridade),
    getCategories(),
  ])

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-14">

        {/* Header */}
        <div className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {params.busca ? `"${params.busca}"` : params.categoria || (params.raridade ? `Itens ${params.raridade}` : "Todos os itens")}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {stockItems.length} {stockItems.length === 1 ? "item disponível" : "itens disponíveis"}
                </p>
              </div>
              <Link href="/anunciar" className="btn-primary text-sm">
                <Plus size={14} /> Anunciar
              </Link>
            </div>

            {/* Filtros */}
            <LojaFiltros
              categories={categories}
              initialRarity={params.raridade}
              initialCategory={params.categoria}
              initialBusca={params.busca}
            />

            {/* Banner encomendas */}
            <Link
              href="/encomendas/nova"
              className="mt-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl"
              style={{
                background: "linear-gradient(90deg, rgba(255,69,0,0.15) 0%, rgba(255,140,0,0.12) 100%)",
                border: "1px solid rgba(255,100,0,0.4)",
                textDecoration: "none",
              }}
            >
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                <span className="font-semibold">Não achou o item?</span>
                <span style={{ color: "var(--text-secondary)" }}> Anuncie uma encomenda e os raiders farmam pra você.</span>
              </p>
              <span className="text-xs font-semibold flex-shrink-0 px-3 py-1 rounded-full" style={{ background: "linear-gradient(90deg, #ff4500, #ff8c00)", color: "#fff" }}>
                Encomendar →
              </span>
            </Link>
          </div>
        </div>

        {/* Grid */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          {stockItems.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Nenhum item encontrado
              </p>
              <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                {params.busca ? `Sem resultados para "${params.busca}"` : "Seja o primeiro a anunciar!"}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/loja" className="btn-secondary text-sm">Ver todos</Link>
                <Link href="/anunciar" className="btn-primary text-sm">
                  <Plus size={14} /> Anunciar
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
              {stockItems.map((s) => (
                <ProductCard
                  key={s.stockId}
                  id={s.stockId}
                  name={s.product.name}
                  slug={s.product.slug}
                  price={s.minPrice}
                  image={s.product.image}
                  category={s.product.category}
                  rarity={s.product.rarity}
                  stock={s.quantity}
                  listingItemId={s.stockId}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
