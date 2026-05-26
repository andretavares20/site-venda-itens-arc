import React from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { DISCORD_URL } from "@/lib/constants"
import { prisma } from "@/lib/db"
import { ExternalLink } from "lucide-react"

const TIERS = [
  {
    name: "DropBay Partners",
    tag: "Parceiro Oficial",
    description: "Criadores e streamers que representam oficialmente a comunidade DropBay.",
    benefits: [
      "Itens exclusivos para sorteios com sua comunidade",
      "Itens para uso durante lives e conteúdo",
      "Acesso antecipado a novidades da plataforma",
    ],
    dark: false,
    image: "/fogueteiro.png",
  },
  {
    name: "Verified Traders",
    tag: "Trader Verificado",
    description: "Vendedores ativos e confiáveis verificados pela DropBay.",
    benefits: [
      "Anúncios em destaque no marketplace",
      "Selo oficial de trader verificado no perfil",
      "Maior visibilidade e confiança para compradores",
    ],
    dark: true,
    image: "/deserto.jpeg",
  },
  {
    name: "Elite Riders",
    tag: "Elite · Exclusivo",
    description: "Criadores apoiados oficialmente pela DropBay.",
    benefits: [
      "Cupom personalizado para sua comunidade",
      "Perfil em destaque na comunidade DropBay",
      "Participação em campanhas e ações exclusivas da marca",
    ],
    dark: false,
    image: "/perdido.jpg",
  },
]

export default async function ParceirosPage() {
  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, twitchUrl: true, avatarUrl: true, description: true },
  })

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />

      <main className="pt-14">

        {/* Hero */}
        <section className="relative overflow-hidden text-center" style={{ borderBottom: "1px solid var(--border)" }}>
          <img
            src="/aranaha.jpg"
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "40%",
              objectFit: "cover",
              objectPosition: "center top",
              filter: "grayscale(100%)",
              opacity: 0.22,
              pointerEvents: "none",
              maskImage: "linear-gradient(to right, transparent 0%, black 60%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 60%)",
            }}
          />
          <div className="relative pt-20 pb-16 px-4">
            <h1 className="font-bold tracking-tight mb-4"
              style={{ color: "var(--text-primary)", fontSize: "clamp(3rem, 7vw, 5.5rem)", letterSpacing: "-0.04em", lineHeight: 1.0 }}>
              Parceiros DropBay.
            </h1>
            <p className="mb-4 mx-auto"
              style={{ color: "var(--text-secondary)", maxWidth: "360px", lineHeight: 1.6, fontSize: "17px", textWrap: "balance" } as React.CSSProperties}>
              Buscamos criadores, streamers e membros ativos da comunidade de ARC Raiders.
            </p>
          </div>
        </section>

        {/* Tiers */}
        {TIERS.map((tier, i) => {
          const bg       = tier.dark ? "#000"     : "#f5f5f7"
          const text     = tier.dark ? "#f5f5f7"  : "#1d1d1f"
          const sub      = tier.dark ? "rgba(255,255,255,0.5)" : "#6e6e73"
          const cardBg   = tier.dark ? "#111111"  : "#000000"
          const cardText = "#f5f5f7"
          const cardSub  = "rgba(255,255,255,0.5)"
          return (
            <section key={i} className="relative overflow-hidden" style={{ background: bg }}>
              <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start gap-12">

                {/* Left — heading */}
                <div className="md:w-2/5 flex-shrink-0">
                  <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
                    style={{ color: sub, letterSpacing: "0.12em" }}>
                    {tier.tag}
                  </p>
                  <h2 className="font-bold tracking-tight mb-4"
                    style={{ color: text, fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                    {tier.name}.
                  </h2>
                  <p style={{ color: sub, fontSize: "17px", lineHeight: 1.6, maxWidth: "360px" }}>
                    {tier.description}
                  </p>
                </div>

                {/* Right — card */}
                <div className="flex-1">
                  <div style={{ position: "relative", background: cardBg, borderRadius: "18px", padding: "36px 32px", overflow: "hidden" }}>
                    {/* Imagem decorativa em P&B */}
                    <img
                      src={tier.image}
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "65%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center top",
                        filter: "grayscale(100%)",
                        opacity: 0.35,
                        pointerEvents: "none",
                        maskImage: "linear-gradient(to left, black 30%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to left, black 30%, transparent 100%)",
                      }}
                    />
                    <p style={{ position: "relative", color: cardSub, fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                      Benefícios
                    </p>
                    <ul style={{ position: "relative", listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                      {tier.benefits.map((b, j) => (
                        <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "15px", color: cardText, lineHeight: 1.5 }}>
                          <span style={{ color: "var(--accent)", marginTop: "3px", flexShrink: 0 }}>—</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            </section>
          )
        })}

        {/* Parceiros ativos */}
        {partners.length > 0 && (
          <section style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="max-w-5xl mx-auto px-6 py-16">
              <p className="text-xs font-semibold mb-3 tracking-widest uppercase text-center"
                style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>
                Parceiros oficiais
              </p>
              <h2 className="font-bold tracking-tight mb-10 text-center"
                style={{ color: "#f5f5f7", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                Conheça nossos parceiros
              </h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {partners.map((p) => (
                  <div key={p.id} className="rounded-2xl p-5 flex flex-col gap-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-3">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                          style={{ background: "rgba(145,71,255,0.15)", color: "#9147ff" }}>
                          {p.name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold" style={{ color: "#f5f5f7" }}>{p.name}</p>
                        <p className="text-xs" style={{ color: "#9147ff" }}>DropBay Partner</p>
                      </div>
                    </div>
                    {p.description && (
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{p.description}</p>
                    )}
                    {p.twitchUrl && (
                      <a href={p.twitchUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium mt-auto"
                        style={{ color: "#9147ff" }}>
                        <ExternalLink size={12} /> Assistir na Twitch
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative overflow-hidden text-center" style={{ background: "#000" }}>
          <img
            src="/fotologo.jpg"
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              height: "100%",
              width: "35%",
              objectFit: "cover",
              objectPosition: "center top",
              filter: "grayscale(100%)",
              opacity: 0.35,
              pointerEvents: "none",
              maskImage: "linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)",
            }}
          />
          <div className="relative max-w-4xl mx-auto px-4 py-20">
            <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em" }}>
              Comunidade
            </p>
            <h2 className="font-bold tracking-tight mb-4"
              style={{ color: "#f5f5f7", fontSize: "clamp(2.2rem, 5vw, 3.8rem)", letterSpacing: "-0.03em", lineHeight: 1.05, whiteSpace: "nowrap" }}>
              Pronto para fazer parte?
            </h2>
            <p className="mb-10 mx-auto"
              style={{ color: "rgba(255,255,255,0.5)", maxWidth: "380px", fontSize: "17px", lineHeight: 1.6 }}>
              Acesse nosso Discord e manifeste seu interesse. Nossa equipe vai entrar em contato.
            </p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full font-medium text-sm"
              style={{ background: "#f5f5f7", color: "#000", padding: "0.6rem 1.75rem" }}>
              Quero ser parceiro
            </a>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}
