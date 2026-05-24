import Navbar from "@/components/navbar"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Package, Plus } from "lucide-react"
import Image from "next/image"

export const revalidate = 0

const cardStyle = `
  .enc-card { transition: border-color 0.15s, transform 0.15s; }
  .enc-card:hover { border-color: rgba(255,255,255,0.16) !important; transform: translateY(-1px); }
`

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default async function EncomendasPage() {
  const session = await auth()

  const encomendas = await prisma.encomenda.findMany({
    where: { status: "ABERTA" },
    include: {
      buyer: { select: { id: true, name: true } },
      product: true,
      proposals: { where: { status: "PENDENTE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Encomendas</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Compradores procurando itens — faça uma proposta e venda
            </p>
          </div>
          {session && (
            <Link href="/encomendas/nova" className="btn-primary text-sm">
              <Plus size={15} /> Nova encomenda
            </Link>
          )}
        </div>

        {/* Lista */}
        {encomendas.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 rounded-2xl text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <Package size={40} style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Nenhuma encomenda aberta no momento</p>
            {session && (
              <Link href="/encomendas/nova" className="btn-primary text-sm">Criar encomenda</Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <style>{cardStyle}</style>
            {encomendas.map((e) => (
              <Link key={e.id} href={`/encomendas/${e.id}`}
                className="enc-card flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)", textDecoration: "none" }}
              >
                {/* Imagem do produto */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: "#0d0d0d" }}>
                  <Image src={e.product.image} alt={e.product.name}
                    width={56} height={56} className="w-full h-full object-contain p-1" />
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {e.product.name}
                    </p>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                      x{e.quantity}
                    </span>
                    <span className="text-xs" style={{ color: rarityColor[e.product.rarity] ?? "#98989f" }}>
                      {e.product.rarity}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {e.product.category}
                  </p>
                  {e.note && (
                    <p className="text-xs mt-1 truncate" style={{ color: "var(--text-tertiary)" }}>
                      {e.note}
                    </p>
                  )}
                </div>

                {/* Preço máximo */}
                {e.maxPrice && (
                  <div className="flex flex-col items-end flex-shrink-0">
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Até</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                      R$ {Number(e.maxPrice).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {e.buyer.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}>
                    {e.proposals.length} proposta{e.proposals.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-sm"
        style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border)" }}>
        <Package size={12} className="inline mr-1" />
        As encomendas são acordos entre comprador e vendedor. O pagamento segue o fluxo normal da plataforma.
      </footer>
    </div>
  )
}
