import Navbar from "@/components/navbar"
import ProductCard from "@/components/product-card"
import { prisma } from "@/lib/db"
import type { Product } from "@prisma/client"
import { Zap } from "lucide-react"

async function getProducts(category?: string) {
  return prisma.product.findMany({
    where: { active: true, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
  })
}

async function getCategories() {
  const result = await prisma.product.groupBy({
    by: ["category"],
    where: { active: true },
  })
  return result.map((r: { category: string }) => r.category)
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>
}) {
  const params = await searchParams
  const [products, categories] = await Promise.all([
    getProducts(params.categoria),
    getCategories(),
  ])

  const filtered: Product[] = params.busca
    ? products.filter((p: Product) =>
        p.name.toLowerCase().includes(params.busca!.toLowerCase())
      )
    : products

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="pt-14">
        {/* Hero */}
        <section className="relative overflow-hidden py-24 px-4 text-center">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,113,227,0.12) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto">
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(0,113,227,0.1)",
                border: "1px solid rgba(0,113,227,0.3)",
                color: "var(--accent)",
              }}
            >
              <Zap size={11} />
              Entrega rápida após confirmação do PIX
            </div>
            <h1
              className="text-5xl sm:text-6xl font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
            >
              Itens de
              <br />
              <span style={{ color: "var(--accent)" }}>Arc Raiders</span>
            </h1>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Os melhores itens in-game com segurança, preço justo e entrega garantida.
            </p>
          </div>
        </section>

        {/* Filtros */}
        <section
          className="sticky top-14 z-40 px-4 py-3"
          style={{
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/"
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{
                  background: !params.categoria ? "var(--accent)" : "var(--surface-2)",
                  color: !params.categoria ? "#fff" : "var(--text-secondary)",
                  border: "1px solid " + (!params.categoria ? "transparent" : "var(--border)"),
                }}
              >
                Todos
              </a>
              {categories.map((cat: string) => (
                <a
                  key={cat}
                  href={`/?categoria=${cat}`}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                  style={{
                    background: params.categoria === cat ? "var(--accent)" : "var(--surface-2)",
                    color: params.categoria === cat ? "#fff" : "var(--text-secondary)",
                    border: "1px solid " + (params.categoria === cat ? "transparent" : "var(--border)"),
                  }}
                >
                  {cat}
                </a>
              ))}
            </div>
            <form className="sm:ml-auto" action="/" method="get">
              {params.categoria && (
                <input type="hidden" name="categoria" value={params.categoria} />
              )}
              <input
                name="busca"
                defaultValue={params.busca}
                placeholder="Buscar item..."
                className="input-field text-sm"
                style={{ width: "200px", padding: "0.375rem 0.75rem", borderRadius: "980px" }}
              />
            </form>
          </div>
        </section>

        {/* Grade de produtos */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Nenhum item encontrado
              </p>
              <p style={{ color: "var(--text-secondary)" }}>
                Tente outro termo ou categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
              {filtered.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={Number(product.price)}
                  image={product.image}
                  category={product.category}
                  rarity={product.rarity}
                  stock={product.stock}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer
        className="mt-auto py-8 text-center text-sm"
        style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border)" }}
      >
        © {new Date().getFullYear()} ArcStore · Todos os direitos reservados
      </footer>
    </div>
  )
}
