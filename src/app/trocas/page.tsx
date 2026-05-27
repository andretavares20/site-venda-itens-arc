import Navbar from "@/components/navbar"
import { prisma } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeftRight, Plus, Package } from "lucide-react"
import TradeSearch from "@/components/trade-search"

const cardStyle = `
  .trade-card { transition: border-color 0.15s, transform 0.15s; }
  .trade-card:hover { border-color: rgba(255,255,255,0.16) !important; transform: translateY(-1px); }
`

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

async function getTrades(busca?: string) {
  return prisma.trade.findMany({
    where: {
      status: "ABERTA",
      ...(busca ? {
        offerItems: {
          some: {
            product: { name: { contains: busca, mode: "insensitive" } },
          },
        },
      } : {}),
    },
    include: {
      user: { select: { id: true, name: true } },
      offerItems: { include: { product: { select: { id: true, name: true, image: true, rarity: true } } } },
      wantItems:  { include: { product: { select: { id: true, name: true, image: true, rarity: true } } } },
      proposals:  { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getRecentTrades() {
  return prisma.trade.findMany({
    include: {
      user: { select: { name: true } },
      offerItems: { include: { product: { select: { name: true, image: true, rarity: true } } } },
      wantItems:  { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })
}

export default async function TrocasPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>
}) {
  const params = await searchParams
  const [trades, recentTrades] = await Promise.all([getTrades(params.busca), getRecentTrades()])

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Trocas</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Troque itens diretamente com outros jogadores — sem taxas
            </p>
          </div>
          <Link href="/trocas/nova" className="btn-primary text-sm">
            <Plus size={15} /> Anunciar troca
          </Link>
        </div>

        {/* Busca com autocomplete */}
        <div className="mb-2">
          <TradeSearch defaultValue={params.busca} />
        </div>
        {params.busca && (
          <p className="text-xs mb-6 ml-1" style={{ color: "var(--text-secondary)" }}>
            {trades.length} resultado{trades.length !== 1 ? "s" : ""} para{" "}
            <span style={{ color: "var(--text-primary)" }}>"{params.busca}"</span>
          </p>
        )}
        {!params.busca && <div className="mb-6" />}

        {/* Lista */}
        {trades.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 rounded-2xl text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <ArrowLeftRight size={40} style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>
              {params.busca
                ? `Nenhuma troca oferecendo "${params.busca}" no momento`
                : "Nenhuma troca disponível ainda"}
            </p>
            <Link href="/trocas/nova" className="btn-primary text-sm">
              {params.busca ? "Anunciar este item para troca" : "Ser o primeiro a anunciar"}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <style>{cardStyle}</style>
            {trades.map((trade) => (
              <Link key={trade.id} href={`/trocas/${trade.id}`}
                className="trade-card flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)", textDecoration: "none" }}
              >
                {/* Itens oferecidos */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>Oferece</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {trade.offerItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                          style={{
                            background: "#0d0d0d",
                            outline: params.busca && item.product.name.toLowerCase().includes(params.busca.toLowerCase())
                              ? "2px solid var(--accent)"
                              : "none",
                          }}>
                          <Image src={item.product.image} alt={item.product.name} width={32} height={32} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-xs font-medium leading-none"
                            style={{
                              color: params.busca && item.product.name.toLowerCase().includes(params.busca.toLowerCase())
                                ? "var(--accent)"
                                : "var(--text-primary)",
                            }}>
                            {item.product.name}
                          </p>
                          <p className="text-xs" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>
                            {item.product.rarity}
                          </p>
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>x{item.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seta */}
                <ArrowLeftRight size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />

                {/* O que quer */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>Quer</p>
                  {trade.wantItems.length === 0 ? (
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                      Aceita qualquer proposta
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      {trade.wantItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                            <Image src={item.product.image} alt={item.product.name} width={32} height={32} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="text-xs font-medium leading-none" style={{ color: "var(--text-primary)" }}>{item.product.name}</p>
                            <p className="text-xs" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>{item.product.rarity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{trade.user.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}>
                    {trade.proposals.length} proposta{trade.proposals.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {/* Atividade recente */}
        {recentTrades.length > 0 && (
          <div className="mt-12">
            <p className="text-xs font-semibold mb-4" style={{ color: "var(--text-tertiary)" }}>
              ATIVIDADE RECENTE
            </p>
            <div className="flex flex-col gap-2">
              {recentTrades.map((t) => {
                const statusMap: Record<string, { label: string; color: string }> = {
                  ABERTA:                 { label: "Aberta",    color: "var(--success)"       },
                  AGUARDANDO_CONFIRMACAO: { label: "Aguardando", color: "var(--warning)"      },
                  CONCLUIDA:              { label: "Concluída", color: "var(--accent)"        },
                  CANCELADA:              { label: "Cancelada", color: "var(--text-tertiary)" },
                }
                const s = statusMap[t.status]
                const firstOffer = t.offerItems[0]
                return (
                  <Link key={t.id} href={`/trocas/${t.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                    {firstOffer && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#0d0d0d" }}>
                        <Image src={firstOffer.product.image} alt={firstOffer.product.name} width={32} height={32} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {t.offerItems.map((i) => i.product.name).join(", ")}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {t.user.name}
                        {t.wantItems.length > 0 && ` · quer: ${t.wantItems.map((i) => i.product.name).join(", ")}`}
                      </p>
                    </div>
                    {s && (
                      <span className="text-xs font-medium flex-shrink-0" style={{ color: s.color }}>
                        {s.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-sm"
        style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border)" }}>
        <Package size={12} className="inline mr-1" />
        As trocas são realizadas diretamente entre os usuários. A plataforma não se responsabiliza pelo resultado.
      </footer>
    </div>
  )
}
