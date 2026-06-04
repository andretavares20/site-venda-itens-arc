"use client"

import { useState } from "react"
import { DISCORD_URL } from "@/lib/constants"

const TIERS = [
  {
    icon: "",
    name: "DropBay Partners",
    tag: "PARCEIRO OFICIAL",
    description: "Parceiros oficiais da comunidade DropBay.",
    benefits: [
      "Itens para sorteios",
      "Itens para utilização durante lives",
      "Acesso antecipado a novidades da plataforma",
    ],
    color: "#0071e3",
    glow: "rgba(0,113,227,0.45)",
    glowSoft: "rgba(0,113,227,0.07)",
    premium: false,
  },
  {
    icon: "",
    name: "Verified Traders",
    tag: "TRADER VERIFICADO",
    description: "Vendedores verificados pela DropBay.",
    benefits: [
      "Redução de 5% na taxa da plataforma",
      "Anúncios em destaque no marketplace",
      "Selo de trader verificado",
      "Maior visibilidade e confiança para compradores",
    ],
    color: "#30d158",
    glow: "rgba(48,209,88,0.45)",
    glowSoft: "rgba(48,209,88,0.07)",
    premium: false,
  },
  {
    icon: "",
    name: "Elite Riders",
    tag: "ELITE · EXCLUSIVO",
    description: "Criadores oficiais patrocinados pela DropBay.",
    benefits: [
      "Cupom personalizado",
      "5% de comissão sobre vendas com o cupom",
      "Perfil em destaque na comunidade",
      "Campanhas e ações exclusivas da marca",
    ],
    color: "#FFB800",
    glow: "rgba(255,184,0,0.5)",
    glowSoft: "rgba(255,184,0,0.08)",
    premium: true,
  },
]

export default function PartnerSection() {
  const [hovered, setHovered] = useState<number | null>(null)
  const [btnHovered, setBtnHovered] = useState(false)

  return (
    <>
      <style>{`
        @keyframes elite-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(255,184,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06); }
          50%       { box-shadow: 0 0 48px rgba(255,184,0,0.36), inset 0 1px 0 rgba(255,255,255,0.06); }
        }
        @keyframes hud-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        .partner-btn-glow:hover {
          box-shadow: 0 0 40px rgba(0,113,227,0.55) !important;
          transform: translateY(-1px) !important;
        }
        .partner-btn-glow:active {
          transform: translateY(0) scale(0.98) !important;
        }
      `}</style>

      <section
        style={{
          background: "#000",
          padding: "96px 20px 100px",
          position: "relative",
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* HUD grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,113,227,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,113,227,0.025) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            pointerEvents: "none",
          }}
        />

        {/* Center radial ambient */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "900px",
            height: "500px",
            background:
              "radial-gradient(ellipse, rgba(0,113,227,0.05) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: "1120px", margin: "0 auto", position: "relative" }}>

          {/* ── Header ── */}
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#0071e3",
                marginBottom: "18px",
                fontFamily: "monospace",
              }}
            >
              ▸ PROGRAMA DE PARCEIROS · DROPBAY
            </p>

            <h2
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#f5f5f7",
                marginBottom: "24px",
              }}
            >
              Torne-se um Parceiro DropBay
            </h2>

            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                maxWidth: "560px",
                margin: "0 auto 14px",
                fontSize: "17px",
                lineHeight: 1.7,
              }}
            >
              A DropBay está em busca de criadores, streamers e membros ativos da
              comunidade de ARC Raiders para fazer parte do nosso programa de parceiros.
            </p>

            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                maxWidth: "500px",
                margin: "0 auto",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              Nosso objetivo é fortalecer a comunidade brasileira do jogo através de um
              ambiente seguro para trades entre players, criação de conteúdo e crescimento
              da comunidade.
            </p>
          </div>

          {/* ── Cards ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              marginBottom: "60px",
              alignItems: "stretch",
            }}
          >
            {TIERS.map((tier, i) => {
              const isHovered = hovered === i

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: "relative",
                    background: isHovered
                      ? `linear-gradient(145deg, rgba(255,255,255,0.04) 0%, ${tier.glowSoft} 100%)`
                      : tier.premium
                      ? "linear-gradient(145deg, rgba(255,184,0,0.03) 0%, rgba(255,255,255,0.01) 100%)"
                      : "rgba(255,255,255,0.015)",
                    border: `1px solid ${
                      isHovered
                        ? tier.color
                        : tier.premium
                        ? "rgba(255,184,0,0.25)"
                        : "rgba(255,255,255,0.07)"
                    }`,
                    borderRadius: "16px",
                    padding: "36px 28px 32px",
                    transition: "border-color 0.3s, background 0.3s, transform 0.3s",
                    boxShadow: tier.premium
                      ? isHovered
                        ? `0 0 48px ${tier.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`
                        : undefined
                      : isHovered
                      ? `0 0 36px ${tier.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
                      : undefined,
                    transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                    animation:
                      tier.premium && !isHovered ? "elite-pulse 3s ease-in-out infinite" : undefined,
                    cursor: "default",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Top accent line */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "15%",
                      right: "15%",
                      height: "1px",
                      background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
                      opacity: isHovered ? 1 : tier.premium ? 0.5 : 0.25,
                      transition: "opacity 0.3s",
                      borderRadius: "1px",
                    }}
                  />

                  {/* RARE badge (Elite only) */}
                  {tier.premium && (
                    <div
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        background: "rgba(255,184,0,0.12)",
                        border: "1px solid rgba(255,184,0,0.4)",
                        borderRadius: "6px",
                        padding: "3px 9px",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        color: "#FFB800",
                        fontFamily: "monospace",
                      }}
                    >
                      RARE
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      fontSize: "44px",
                      marginBottom: "18px",
                      lineHeight: 1,
                      filter: isHovered ? `drop-shadow(0 0 14px ${tier.color})` : "none",
                      transition: "filter 0.3s",
                    }}
                  >
                    {tier.icon}
                  </div>

                  {/* Tag */}
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: tier.color,
                      marginBottom: "8px",
                      fontFamily: "monospace",
                    }}
                  >
                    {tier.tag}
                  </p>

                  {/* Name */}
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "#f5f5f7",
                      marginBottom: "10px",
                    }}
                  >
                    {tier.name}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      marginBottom: "22px",
                    }}
                  >
                    {tier.description}
                  </p>

                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "rgba(255,255,255,0.07)",
                      marginBottom: "20px",
                    }}
                  />

                  {/* Benefits */}
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "11px",
                      flex: 1,
                    }}
                  >
                    {tier.benefits.map((b, j) => (
                      <li
                        key={j}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.6)",
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            color: tier.color,
                            fontSize: "9px",
                            marginTop: "4px",
                            flexShrink: 0,
                            fontFamily: "monospace",
                          }}
                        >
                          ▸
                        </span>
                        {b.charAt(0).toUpperCase() + b.slice(1)}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* ── CTA ── */}
          <div style={{ textAlign: "center" }}>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-btn-glow"
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "linear-gradient(135deg, #0071e3 0%, #0058b8 100%)",
                color: "#fff",
                padding: "0.85rem 2.4rem",
                borderRadius: "980px",
                fontWeight: 600,
                fontSize: "15px",
                textDecoration: "none",
                boxShadow: "0 0 28px rgba(0,113,227,0.35)",
                transition: "box-shadow 0.25s, transform 0.2s",
                letterSpacing: "-0.01em",
              }}
            >
              Quero ser parceiro
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            <p
              style={{
                color: "rgba(255,255,255,0.2)",
                fontSize: "12px",
                marginTop: "16px",
                fontFamily: "monospace",
                letterSpacing: "0.06em",
              }}
            >
              VIA DISCORD · COMUNIDADE DROPBAY
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
