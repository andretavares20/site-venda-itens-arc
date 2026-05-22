import Navbar from "@/components/navbar"
import Link from "next/link"
import { prisma } from "@/lib/db"
import Carousel from "@/components/carousel"
import Footer from "@/components/footer"

const GRID_CATEGORIES = [
  { category: "Assault Rifle", title: "Assault Rifles",  sub: "As melhores armas do jogo.",       dark: true,  slug: "Temporal IV"  },
  { category: "Pistol",        title: "Pistols",         sub: "Compactas, precisas e letais.",     dark: false, slug: "Venator IV" },
  { category: "Modification",  title: "Modificações",    sub: "Eleve seu equipamento ao limite.",  dark: false, slug: "Cinético" },
  { category: "Sniper Rifle",  title: "Sniper Rifles",   sub: "Alcance. Precisão. Domínio.",       dark: true,  slug: null },
  { category: "Quick Use",     title: "Uso Rápido",      sub: "Itens essenciais para sobreviver.", dark: true,  slug: "Mosquetão" },
  { category: "SMG",           title: "SMGs",            sub: "Cadência alta. Dano garantido.",    dark: false, slug: null },
]

async function getGridItems() {
  const results = await Promise.all(
    GRID_CATEGORIES.map(async (g) => {
      const item = await prisma.product.findFirst({
        where: {
          active: true,
          category: g.category,
          ...(g.slug ? { name: { contains: g.slug, mode: "insensitive" } } : {}),
        },
        select: { image: true, slug: true },
        orderBy: { rarity: "desc" },
      })
      return { ...g, image: item?.image ?? null }
    })
  )
  return results
}

export default async function Home() {
  const gridItems = await getGridItems()
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="pt-14">
        {/* Hero */}
        <section className="relative overflow-hidden text-center" style={{ borderBottom: "1px solid var(--border)", minHeight: "520px" }}>
          <img src="/trocas.jpg" alt="" aria-hidden="true"
            style={{
              position: "absolute", top: 0, right: 0,
              width: "55%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
              filter: "grayscale(100%)", opacity: 0.35, pointerEvents: "none",
              maskImage: "linear-gradient(to right, transparent 0%, black 35%, black 70%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 35%, black 70%, transparent 100%)",
            }} />
          <div className="relative pt-20 pb-20 px-4">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "var(--text-secondary)", letterSpacing: "0.12em" }}>
              Marketplace de itens · Arc Raiders
            </p>
            <h1 className="font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", fontSize: "clamp(3rem, 7vw, 5.5rem)", letterSpacing: "-0.04em", lineHeight: 1.0 }}>
              DropBay.
            </h1>
            <p className="mb-8 mx-auto"
              style={{ color: "var(--text-secondary)", maxWidth: "400px", lineHeight: 1.6, fontSize: "17px" }}>
              Compre, venda e troque itens in-game com segurança.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/loja"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "var(--accent)", color: "#fff", padding: "0.6rem 1.75rem" }}>
                Ver itens
              </Link>
              <Link href="/anunciar"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "transparent", color: "var(--accent)", padding: "0.6rem 1.75rem", border: "1px solid rgba(0,113,227,0.5)" }}>
                Anunciar item
              </Link>
            </div>
          </div>
        </section>

        {/* Seção 2 — Épicos e Lendários (fundo branco, letra preta) */}
        <section className="relative overflow-hidden text-center" style={{ background: "#f5f5f7", minHeight: "460px" }}>
          <img src="/epicos.png" alt="" aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
              filter: "grayscale(100%)", opacity: 0.12, pointerEvents: "none",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 65%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 65%, transparent 100%)",
            }} />
          <div className="relative max-w-4xl mx-auto px-4 py-20">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Os mais raros
            </p>
            <h2 className="font-bold tracking-tight mb-3"
              style={{ color: "#1d1d1f", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Épicos e Lendários.
            </h2>
            <p className="mb-8 mx-auto" style={{ color: "#6e6e73", maxWidth: "360px", fontSize: "17px", lineHeight: 1.6 }}>
              Os itens mais raros de Arc Raiders, verificados e prontos para entrega.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/loja?raridade=Legendary"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "#1d1d1f", color: "#fff", padding: "0.6rem 1.75rem" }}>
                Ver lendários
              </Link>
              <Link href="/loja?raridade=Epic"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "transparent", color: "#1d1d1f", padding: "0.6rem 1.75rem", border: "1px solid rgba(0,0,0,0.25)" }}>
                Ver épicos
              </Link>
            </div>
          </div>
        </section>

        {/* Seção 3 — Trocas (fundo preto, letra branca) */}
        <section className="relative overflow-hidden text-center" style={{ background: "#000", minHeight: "460px" }}>
          <img src="/hero.jpg" alt="" aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
              filter: "grayscale(100%)", opacity: 0.3, pointerEvents: "none",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 65%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 65%, transparent 100%)",
            }} />
          <div className="relative max-w-4xl mx-auto px-4 py-20">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
              Gratuito
            </p>
            <h2 className="font-bold tracking-tight mb-3"
              style={{ color: "#f5f5f7", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Trocas diretas.
            </h2>
            <p className="mb-8 mx-auto" style={{ color: "rgba(255,255,255,0.5)", maxWidth: "380px", fontSize: "17px", lineHeight: 1.6 }}>
              Troque itens diretamente com outros jogadores. Sem taxas, sem intermediários.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/trocas"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "#f5f5f7", color: "#000", padding: "0.6rem 1.75rem" }}>
                Ver trocas
              </Link>
              <Link href="/trocas/nova"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "transparent", color: "#f5f5f7", padding: "0.6rem 1.75rem", border: "1px solid rgba(255,255,255,0.25)" }}>
                Criar troca
              </Link>
            </div>
          </div>
        </section>

        {/* Seção 4 — Venda seus itens (fundo branco, letra preta) */}
        <section className="relative overflow-hidden text-center" style={{ background: "#f5f5f7", minHeight: "460px" }}>
          <img src="/venda.png" alt="" aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
              filter: "grayscale(100%)", opacity: 0.12, pointerEvents: "none",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 65%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 65%, transparent 100%)",
            }} />
          <div className="relative max-w-4xl mx-auto px-4 py-20">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "#6e6e73", letterSpacing: "0.12em" }}>
              Para vendedores
            </p>
            <h2 className="font-bold tracking-tight mb-3"
              style={{ color: "#1d1d1f", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Venda seus itens.
            </h2>
            <p className="mb-8 mx-auto" style={{ color: "#6e6e73", maxWidth: "400px", fontSize: "17px", lineHeight: 1.6 }}>
              Anuncie seus itens com segurança. Taxa de apenas 10% sobre cada venda concluída.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/anunciar"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "#1d1d1f", color: "#fff", padding: "0.6rem 1.75rem" }}>
                Começar a vender
              </Link>
              <Link href="/minha-conta/anuncios"
                className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                style={{ background: "transparent", color: "#1d1d1f", padding: "0.6rem 1.75rem", border: "1px solid rgba(0,0,0,0.25)" }}>
                Meus anúncios
              </Link>
            </div>
          </div>
        </section>
      </main>

        {/* Grade 2x3 estilo Apple — fundo branco na página, cards pretos se destacam */}
        <section style={{ background: "#FFFFFF", padding: "12px", paddingTop: "60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

            {gridItems.map((card, i) => {
              const dark = card.dark
              const textColor = dark ? "#f5f5f7" : "#1d1d1f"
              const subColor  = dark ? "rgba(255,255,255,0.5)" : "#6e6e73"
              const bg        = dark ? "#000000" : "#F5F5F7"
              const btnBg     = dark ? "#f5f5f7" : "#1d1d1f"
              const btnColor  = dark ? "#000" : "#fff"
              return (
                <div key={i} className="relative overflow-hidden flex flex-col items-center justify-between text-center"
                  style={{ background: bg, height: "400px", padding: "36px 28px 0" }}>

                  {/* Texto */}
                  <div>
                    <h3 className="font-bold tracking-tight mb-3"
                      style={{ color: textColor, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                      {card.title}
                    </h3>
                    <p className="mb-7 mx-auto" style={{ color: subColor, fontSize: "15px", lineHeight: 1.5, maxWidth: "260px" }}>
                      {card.sub}
                    </p>
                    <Link href={`/loja?categoria=${encodeURIComponent(card.category)}`}
                      className="inline-flex items-center justify-center rounded-full font-medium text-sm"
                      style={{ background: btnBg, color: btnColor, padding: "0.5rem 1.5rem" }}>
                      Ver itens
                    </Link>
                  </div>

                  {/* Imagem */}
                  {card.image && (
                    <div className="flex items-end justify-center w-full" style={{ paddingTop: "0px", paddingBottom: "64px" }}>
                      <img src={card.image} alt={card.title}
                        className="object-contain"
                        style={{ maxHeight: "180px", maxWidth: "220px" }}
                      />
                    </div>
                  )}
                </div>
              )
            })}

          </div>
        </section>

        {/* Carrossel — ativado quando tivermos destaques */}
        {/* <Carousel /> */}

      <Footer />
    </div>
  )
}
