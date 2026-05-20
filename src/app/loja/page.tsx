import Navbar from "@/components/navbar"
import ProductCard from "@/components/product-card"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus } from "lucide-react"

async function getListingItems(category?: string, busca?: string, rarity?: string) {
  return prisma.listingItem.findMany({
    where: {
      status: "DISPONIVEL",
      listing: { status: "DISPONIVEL" },
      product: {
        active: true,
        ...(category ? { category } : {}),
        ...(rarity ? { rarity } : {}),
        ...(busca ? { name: { contains: busca, mode: "insensitive" } } : {}),
      },
    },
    include: {
      product: true,
      listing: { include: { seller: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getCategories() {
  const result = await prisma.product.groupBy({
    by: ["category"],
    where: { active: true },
  })
  return result.map((r: { category: string }) => r.category).sort()
}

const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"]
const RARITY_COLOR: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3",
  Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string; raridade?: string }>
}) {
  const params = await searchParams
  const [listingItems, categories] = await Promise.all([
    getListingItems(params.categoria, params.busca, params.raridade),
    getCategories(),
  ])

  const hasFilter = params.categoria || params.busca || params.raridade

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-14">

        {/* Header da loja */}
        <div className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {params.busca ? `"${params.busca}"` : params.categoria || params.raridade || "Todos os itens"}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {listingItems.length} {listingItems.length === 1 ? "item disponível" : "itens disponíveis"}
                </p>
              </div>
              <Link href="/anunciar" className="btn-primary text-sm">
                <Plus size={14} /> Anunciar
              </Link>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <a href="/loja"
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  background: !hasFilter ? "var(--accent)" : "var(--surface-2)",
                  color: !hasFilter ? "#fff" : "var(--text-secondary)",
                }}>
                Todos
              </a>

              {/* Raridades */}
              {RARITIES.map(r => (
                <a key={r} href={`/loja?raridade=${r}`}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                  style={{
                    background: params.raridade === r ? `${RARITY_COLOR[r]}22` : "var(--surface-2)",
                    color: params.raridade === r ? RARITY_COLOR[r] : "var(--text-secondary)",
                    border: `1px solid ${params.raridade === r ? `${RARITY_COLOR[r]}44` : "transparent"}`,
                  }}>
                  {r}
                </a>
              ))}

              <div className="w-px mx-1" style={{ background: "var(--border)" }} />

              {/* Categorias */}
              {categories.map(cat => (
                <a key={cat} href={`/loja?categoria=${cat}`}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                  style={{
                    background: params.categoria === cat ? "var(--accent)" : "var(--surface-2)",
                    color: params.categoria === cat ? "#fff" : "var(--text-secondary)",
                  }}>
                  {cat}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          {listingItems.length === 0 ? (
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
              {listingItems.map((li) => (
                <ProductCard
                  key={li.id}
                  id={li.id}
                  name={li.product.name}
                  slug={li.product.slug}
                  price={Number(li.price)}
                  image={li.product.image}
                  category={li.product.category}
                  rarity={li.product.rarity}
                  stock={li.quantity}
                  sellerId={li.listing.seller.id}
                  sellerName={li.listing.seller.name}
                  listingItemId={li.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-sm"
        style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border)" }}>
        © {new Date().getFullYear()} DropBay · Marketplace de itens Arc Raiders
      </footer>
    </div>
  )
}
