import Navbar from "@/components/navbar"
import ProductCard from "@/components/product-card"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Plus } from "lucide-react"

async function getListingItems(category?: string, busca?: string) {
  return prisma.listingItem.findMany({
    where: {
      status: "DISPONIVEL",
      listing: { status: "DISPONIVEL" },
      product: {
        active: true,
        ...(category ? { category } : {}),
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


export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>
}) {
  const params = await searchParams
  const [listingItems, categories] = await Promise.all([
    getListingItems(params.categoria, params.busca),
    getCategories(),
  ])

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="pt-14">
        {/* Hero */}
        <section className="relative overflow-hidden text-center" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 100% 80% at 50% -10%, rgba(0,113,227,0.08) 0%, transparent 70%)",
          }} />
          <div className="relative pt-20 pb-10 px-4">
            <p className="text-sm font-semibold mb-3 tracking-wide uppercase" style={{ color: "var(--accent)", letterSpacing: "0.08em" }}>
              Marketplace de itens
            </p>
            <h1 className="font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Arc Raiders.
            </h1>
            <p className="text-xl mb-8 mx-auto" style={{ color: "var(--text-secondary)", maxWidth: "480px", lineHeight: 1.5 }}>
              Compre e venda itens in-game com segurança. Taxa de apenas 10%.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href="#catalogo" className="btn-primary" style={{ padding: "0.625rem 1.5rem" }}>
                Ver itens
              </a>
              <Link href="/anunciar" className="btn-secondary" style={{ padding: "0.625rem 1.5rem" }}>
                <Plus size={16} /> Anunciar item
              </Link>
            </div>
          </div>

        </section>

        {/* Filtros */}
        <section id="catalogo" className="sticky top-14 z-40 px-4 py-3"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)" }}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <a href="/" className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: !params.categoria ? "var(--accent)" : "var(--surface-2)", color: !params.categoria ? "#fff" : "var(--text-secondary)" }}>
                Todos
              </a>
              {categories.map((cat: string) => (
                <a key={cat} href={`/?categoria=${cat}`}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: params.categoria === cat ? "var(--accent)" : "var(--surface-2)", color: params.categoria === cat ? "#fff" : "var(--text-secondary)" }}>
                  {cat}
                </a>
              ))}
            </div>
            <form className="sm:ml-auto" action="/" method="get">
              {params.categoria && <input type="hidden" name="categoria" value={params.categoria} />}
              <input name="busca" defaultValue={params.busca} placeholder="Buscar item..."
                className="input-field text-sm"
                style={{ width: "200px", padding: "0.375rem 0.75rem", borderRadius: "980px" }} />
            </form>
          </div>
        </section>

        {/* Grade */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          {listingItems.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Nenhum item disponível
              </p>
              <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                Seja o primeiro a anunciar!
              </p>
              <Link href="/anunciar" className="btn-primary">
                <Plus size={16} /> Criar anúncio
              </Link>
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

      <footer className="mt-auto py-8 text-center text-sm"
        style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border)" }}>
        © {new Date().getFullYear()} ArcStore · Marketplace de itens Arc Raiders
      </footer>
    </div>
  )
}
