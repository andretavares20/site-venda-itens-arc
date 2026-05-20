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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string }>
}) {
  const params = await searchParams
  const listingItems = await getListingItems(params.categoria, params.busca)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="pt-14">
        {/* Hero — estilo Apple */}
        <section className="relative overflow-hidden text-center" style={{ borderBottom: "1px solid var(--border)" }}>
          {/* Texto */}
          <div className="relative pt-20 pb-6 px-4">
            <p className="text-sm font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "var(--text-secondary)", letterSpacing: "0.12em", fontSize: "11px" }}>
              Marketplace de itens · Arc Raiders
            </p>
            <h1 className="font-bold tracking-tight mb-4"
              style={{
                color: "var(--text-primary)",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                letterSpacing: "-0.04em",
                lineHeight: 1.0,
              }}>
              DropBay.
            </h1>
            <p className="mb-8 mx-auto"
              style={{ color: "var(--text-secondary)", maxWidth: "400px", lineHeight: 1.6, fontSize: "17px" }}>
              Compre, venda e troque itens in-game com segurança.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="#catalogo"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm transition-all"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  padding: "0.6rem 1.75rem",
                }}>
                Ver itens
              </a>
              <Link href="/anunciar"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm transition-all"
                style={{
                  background: "transparent",
                  color: "var(--accent)",
                  padding: "0.6rem 1.75rem",
                  border: "1px solid rgba(0,113,227,0.5)",
                }}>
                Anunciar item
              </Link>
            </div>
          </div>

          {/* Imagem hero — como Apple com os iPhones */}
          <div className="relative mx-auto" style={{ maxWidth: "900px" }}>
            <div style={{
              maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
            }}>
              <img
                src="/hero.jpg"
                alt="Arc Raiders"
                className="w-full object-cover object-top"
                style={{ maxHeight: "520px", objectPosition: "top center" }}
              />
            </div>
          </div>
        </section>

        {/* Grade */}
        <section id="catalogo" className="max-w-6xl mx-auto px-4 py-12">
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
        © {new Date().getFullYear()} DropBay · Marketplace de itens Arc Raiders
      </footer>
    </div>
  )
}
