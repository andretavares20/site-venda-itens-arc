import Navbar from "@/components/navbar"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Package, Plus } from "lucide-react"
import Image from "next/image"

export const revalidate = 0

export default async function EncomendasPage() {
  const session = await auth()

  const encomendas = await prisma.encomenda.findMany({
    where: { status: "ABERTA" },
    include: {
      buyer: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, image: true, category: true } },
      proposals: { where: { status: "PENDENTE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Encomendas
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Compradores procurando itens — faça uma proposta e venda
            </p>
          </div>
          {session && (
            <Link href="/encomendas/nova" className="btn-primary text-sm flex items-center gap-2">
              <Plus size={16} /> Nova encomenda
            </Link>
          )}
        </div>

        {encomendas.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 rounded-2xl"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <Package size={40} style={{ color: "var(--text-tertiary)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Nenhuma encomenda aberta no momento
            </p>
            {session && (
              <Link href="/encomendas/nova" className="btn-primary text-sm">
                Criar encomenda
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {encomendas.map((e) => (
              <Link key={e.id} href={`/encomendas/${e.id}`}
                className="flex gap-4 p-4 rounded-2xl transition-all"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)", textDecoration: "none" }}
                onMouseEnter={(el) => { (el.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; (el.currentTarget as HTMLElement).style.transform = "translateY(-1px)" }}
                onMouseLeave={(el) => { (el.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (el.currentTarget as HTMLElement).style.transform = "translateY(0)" }}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                  style={{ background: "var(--surface-2)" }}>
                  <Image src={e.product.image} alt={e.product.name} width={64} height={64}
                    className="w-full h-full object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {e.product.name}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                      x{e.quantity}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    por {e.buyer.name}
                  </p>
                  {e.maxPrice && (
                    <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--success)" }}>
                      Até R$ {Number(e.maxPrice).toFixed(2)}
                    </p>
                  )}
                  {e.note && (
                    <p className="text-xs mt-1 truncate" style={{ color: "var(--text-tertiary)" }}>
                      {e.note}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {e.proposals.length} proposta{e.proposals.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(e.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
