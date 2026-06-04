import Navbar from "@/components/navbar"
import Link from "next/link"
import { prisma } from "@/lib/db"
import HeroVideo from "@/components/hero-video"
import Footer from "@/components/footer"
import PartnerCarousel from "@/components/partner-carousel"
import ProductCard from "@/components/product-card"
import { extractTwitchUsername, getLiveUsernames } from "@/lib/twitch"
import { ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

// ── data helpers ─────────────────────────────────────────────────

async function getRecentListings() {
  return prisma.stock.findMany({
    where: { active: true, quantity: { gt: 0 }, product: { active: true } },
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  })
}

async function getOpenTrades() {
  return prisma.trade.findMany({
    where: { status: "ABERTA" },
    include: {
      offerItems: {
        include: { product: { select: { image: true, name: true } } },
        take: 3,
      },
      user: { select: { name: true } },
      _count: { select: { proposals: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  })
}

async function getOpenSquads() {
  return (prisma as any).activitySlot.findMany({
    where: { status: "ABERTO" },
    include: {
      user: { select: { name: true } },
      members: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  }) as Promise<any[]>
}

async function getOpenEncomendas() {
  return prisma.encomenda.findMany({
    where: { status: "ABERTA" },
    include: {
      product: { select: { image: true, name: true } },
      buyer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  })
}

type PartnerRow = {
  id: string
  name: string
  twitchUrl: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  description: string | null
}

async function getPartners() {
  const partners = await (prisma as any).partner.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, twitchUrl: true, avatarUrl: true, bannerUrl: true, description: true },
  }) as PartnerRow[]

  const usernames = partners
    .map((p: PartnerRow) => (p.twitchUrl ? extractTwitchUsername(p.twitchUrl) : null))
    .filter((u: string | null): u is string => u !== null)

  const liveSet = await getLiveUsernames(usernames)

  return partners.map((p: PartnerRow) => ({
    ...p,
    isLive: p.twitchUrl ? liveSet.has(extractTwitchUsername(p.twitchUrl) ?? "") : false,
  }))
}

const activityLabels: Record<string, string> = {
  SUBIR_LEVEL: "Subir Level",
  FARM_XP: "Farm XP",
  COLECOES: "Coleções",
  DESAFIOS_SEMANAIS: "Desafios Semanais",
  PROJETOS: "Projetos",
}

// ── alternating section colors ────────────────────────────────────

type SectionKey = "listings" | "trades" | "squads" | "encomendas"

function buildPalette(visible: SectionKey[]) {
  const white = { bg: "#f5f5f7", title: "#1d1d1f", label: "#6e6e73", link: "#1d1d1f", cardBg: "#0d0d0d", cardBorder: "rgba(0,0,0,0.12)", text: "#f5f5f7", sub: "rgba(255,255,255,0.4)" }
  const black = { bg: "#000",     title: "#f5f5f7", label: "rgba(255,255,255,0.4)", link: "rgba(255,255,255,0.6)", cardBg: "#111", cardBorder: "rgba(255,255,255,0.08)", text: "#f5f5f7", sub: "rgba(255,255,255,0.4)" }
  return Object.fromEntries(visible.map((key, i) => [key, i % 2 === 0 ? white : black])) as Record<SectionKey, typeof white>
}

// ── page ─────────────────────────────────────────────────────────

export default async function Home() {
  const [recentListings, openTrades, openSquads, openEncomendas, partners] = await Promise.all([
    getRecentListings(),
    getOpenTrades(),
    getOpenSquads(),
    getOpenEncomendas(),
    getPartners(),
  ])

  const visibleSections = ([
    recentListings.length > 0  ? "listings"   : null,
    openTrades.length > 0      ? "trades"      : null,
    openSquads.length > 0      ? "squads"      : null,
    openEncomendas.length > 0  ? "encomendas"  : null,
  ].filter(Boolean)) as SectionKey[]

  const pal = buildPalette(visibleSections)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="pt-14">

        {/* Hero — escuro */}
        <section className="relative overflow-hidden text-center" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative pt-20 pb-6 px-4">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "var(--text-secondary)", letterSpacing: "0.12em" }}>
              Comunidade Arc Raiders
            </p>
            <h1 className="font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", fontSize: "clamp(3rem, 7vw, 5.5rem)", letterSpacing: "-0.04em", lineHeight: 1.0 }}>
              DropBay.
            </h1>
            <p className="mb-8 mx-auto"
              style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "17px", maxWidth: "460px" }}>
              Onde os jogadores de Arc Raiders se encontram.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/loja"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "var(--accent)", color: "#fff", padding: "0.6rem 1.75rem" }}>
                Explorar
              </Link>
              <Link href="/squad"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "transparent", color: "var(--accent)", padding: "0.6rem 1.75rem", border: "1px solid rgba(0,113,227,0.5)" }}>
                Entrar no Squad
              </Link>
            </div>
          </div>
          <HeroVideo />
        </section>

        {/* Anúncios recentes */}
        {recentListings.length > 0 && (
          <section style={{ background: pal.listings.bg, padding: "60px 0" }}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
                    style={{ color: pal.listings.label, letterSpacing: "0.12em" }}>
                    Loja
                  </p>
                  <h2 className="font-bold tracking-tight"
                    style={{ color: pal.listings.title, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                    Anúncios recentes.
                  </h2>
                </div>
                <Link href="/loja" className="flex items-center gap-1 text-sm font-medium mb-1"
                  style={{ color: pal.listings.link }}>
                  Ver todos <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {recentListings.map((s) => (
                  <ProductCard
                    key={s.id}
                    id={s.id}
                    name={s.product.name}
                    slug={s.product.slug}
                    price={Number(s.price)}
                    image={s.product.image}
                    category={s.product.category}
                    rarity={s.product.rarity}
                    stock={s.quantity}
                    listingItemId={s.id}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trocas abertas */}
        {openTrades.length > 0 && (
          <section style={{ background: pal.trades.bg, padding: "60px 0" }}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
                    style={{ color: pal.trades.label, letterSpacing: "0.12em" }}>
                    Trocas
                  </p>
                  <h2 className="font-bold tracking-tight"
                    style={{ color: pal.trades.title, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                    Trocas abertas.
                  </h2>
                </div>
                <Link href="/trocas" className="flex items-center gap-1 text-sm font-medium mb-1"
                  style={{ color: pal.trades.link }}>
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {openTrades.map((trade) => (
                  <Link key={trade.id} href={`/trocas/${trade.id}`}
                    className="flex flex-col gap-3 p-4 rounded-2xl hover:opacity-80 transition-opacity"
                    style={{ background: pal.trades.cardBg, border: `1px solid ${pal.trades.cardBorder}` }}>
                    <div className="flex gap-1.5 flex-wrap">
                      {trade.offerItems.map((item, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                          style={{ background: "#1a1a1a" }}>
                          <img src={item.product.image} alt={item.product.name}
                            className="w-full h-full object-contain p-1" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate" style={{ color: pal.trades.text }}>
                        {trade.user.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: pal.trades.sub }}>
                        {trade._count.proposals} proposta{trade._count.proposals !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Squads buscando membros */}
        {openSquads.length > 0 && (
          <section style={{ background: pal.squads.bg, padding: "60px 0" }}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
                    style={{ color: pal.squads.label, letterSpacing: "0.12em" }}>
                    Squad
                  </p>
                  <h2 className="font-bold tracking-tight"
                    style={{ color: pal.squads.title, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                    Buscando membros.
                  </h2>
                </div>
                <Link href="/squad" className="flex items-center gap-1 text-sm font-medium mb-1"
                  style={{ color: pal.squads.link }}>
                  Ver squads <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {openSquads.map((slot: any) => (
                  <Link key={slot.id} href="/squad"
                    className="flex flex-col gap-3 p-4 rounded-2xl hover:opacity-80 transition-opacity"
                    style={{ background: pal.squads.cardBg, border: `1px solid ${pal.squads.cardBorder}` }}>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
                      style={{ background: "rgba(0,113,227,0.15)", color: "#0071e3", border: "1px solid rgba(0,113,227,0.25)" }}>
                      {activityLabels[slot.activity] ?? slot.activity}
                    </span>
                    <p className="text-xs font-medium truncate" style={{ color: pal.squads.text }}>
                      {slot.user.name}
                    </p>
                    <p className="text-xs" style={{ color: pal.squads.sub }}>
                      {slot.members.length + 1} participante{slot.members.length + 1 !== 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Encomendas abertas */}
        {openEncomendas.length > 0 && (
          <section style={{ background: pal.encomendas.bg, padding: "60px 0" }}>
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold mb-2 tracking-widest uppercase"
                    style={{ color: pal.encomendas.label, letterSpacing: "0.12em" }}>
                    Encomendas
                  </p>
                  <h2 className="font-bold tracking-tight"
                    style={{ color: pal.encomendas.title, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                    Encomendas abertas.
                  </h2>
                </div>
                <Link href="/encomendas" className="flex items-center gap-1 text-sm font-medium mb-1"
                  style={{ color: pal.encomendas.link }}>
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {openEncomendas.map((enc) => (
                  <Link key={enc.id} href={`/encomendas/${enc.id}`}
                    className="flex flex-col gap-3 p-4 rounded-2xl hover:opacity-80 transition-opacity"
                    style={{ background: pal.encomendas.cardBg, border: `1px solid ${pal.encomendas.cardBorder}` }}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden"
                      style={{ background: "#1a1a1a" }}>
                      <img src={enc.product.image} alt={enc.product.name}
                        className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="text-xs font-medium line-clamp-2" style={{ color: pal.encomendas.text }}>
                        {enc.product.name}
                      </p>
                      <p className="text-xs" style={{ color: pal.encomendas.sub }}>
                        x{enc.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: pal.encomendas.text }}>
                      {enc.maxPrice ? `até R$ ${Number(enc.maxPrice).toFixed(0)}` : "Preço aberto"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trocas diretas — branco */}
        <section className="relative overflow-hidden text-center" style={{ background: "#f5f5f7" }}>
          <div className="max-w-4xl mx-auto px-4 pt-16 pb-0">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Gratuito
            </p>
            <h2 className="font-bold tracking-tight mb-3"
              style={{ color: "#1d1d1f", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Trocas diretas.
            </h2>
            <p className="mb-8 mx-auto" style={{ color: "#6e6e73", maxWidth: "380px", fontSize: "17px", lineHeight: 1.6 }}>
              Troque itens diretamente com outros jogadores. Sem taxas, sem intermediários.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
              <Link href="/trocas"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "#1d1d1f", color: "#fff", padding: "0.6rem 1.75rem" }}>
                Ver trocas
              </Link>
              <Link href="/trocas/nova"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "transparent", color: "#1d1d1f", padding: "0.6rem 1.75rem", border: "1px solid rgba(0,0,0,0.25)" }}>
                Criar troca
              </Link>
            </div>
          </div>
          <div className="mx-auto" style={{ maxWidth: "900px" }}>
            <div style={{ maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" }}>
              <img src="/trocas.jpg" alt="Trocas diretas" className="w-full object-cover" style={{ maxHeight: "480px", objectPosition: "top center" }} />
            </div>
          </div>
        </section>

        {/* Trades seguras — preto */}
        <section className="relative overflow-hidden text-center" style={{ background: "#000" }}>
          <div className="max-w-4xl mx-auto px-4 py-20">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
              Transparência
            </p>
            <h2 className="font-bold tracking-tight mb-4"
              style={{ color: "#f5f5f7", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Trades seguras.
            </h2>
            <p className="mb-10 mx-auto"
              style={{ color: "rgba(255,255,255,0.5)", maxWidth: "400px", fontSize: "17px", lineHeight: 1.6 }}>
              Negociações diretas entre jogadores, com pagamento protegido até a entrega ser confirmada.
            </p>
            <Link href="/como-funciona"
              className="inline-flex items-center justify-center rounded-full font-medium text-sm"
              style={{ background: "#f5f5f7", color: "#000", padding: "0.6rem 1.75rem" }}>
              Como funciona
            </Link>
          </div>
        </section>

      </main>

      {partners.length > 0 && <PartnerCarousel partners={partners} />}

      <Footer />
    </div>
  )
}
