"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"

type Partner = {
  id: string
  name: string
  twitchUrl: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  description: string | null
  isLive?: boolean
}

function getWeeklyStartIndex(total: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
  return week % total
}

export default function PartnerCarousel({ partners }: { partners: Partner[] }) {
  const [current, setCurrent] = useState(() => getWeeklyStartIndex(partners.length))
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const go = useCallback((index: number) => {
    if (animating) return
    setAnimating(true)
    setCurrent((index + partners.length) % partners.length)
    setTimeout(() => setAnimating(false), 400)
  }, [animating, partners.length])

  const next = useCallback(() => go(current + 1), [go, current])
  const prev = useCallback(() => go(current - 1), [go, current])

  useEffect(() => {
    timerRef.current = setTimeout(next, 6000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [current, next])

  if (!partners.length) return null

  const p = partners[current]

  return (
    <section style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <style>{`
        @keyframes pc-fade { from { opacity: 0; transform: scale(1.015); } to { opacity: 1; transform: scale(1); } }
        @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .pc-slide { animation: pc-fade 0.4s ease; }
        .pc-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .pc-twitch:hover { background: rgba(145,71,255,0.25) !important; }
        .pc-dot-btn:hover { opacity: 1 !important; }
        .live-dot { animation: live-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-4 text-center">
        <p className="text-xs font-semibold mb-3 tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>
          Parceiros DropBay
        </p>
        <h2 className="font-bold tracking-tight mb-12"
          style={{ color: "#f5f5f7", fontSize: "clamp(2rem, 4vw, 3.2rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Nossos Criadores.
        </h2>
      </div>

      {/* Carrossel */}
      <div className="relative" style={{ overflow: "hidden" }}>
        <div className="max-w-5xl mx-auto px-6 pb-12">

          {/* Card principal */}
          <div key={p.id} className="pc-slide relative rounded-2xl overflow-hidden"
            style={{ background: "#111", aspectRatio: "16/7" }}>

            {/* Background: avatar desfocado */}
            {p.avatarUrl && (
              <img src={p.avatarUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "blur(10px)", transform: "scale(1.07)", opacity: 0.55 }} />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.2) 100%)" }} />

            {/* Conteúdo */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <div className="flex items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                  {p.avatarUrl && (
                    <img src={p.avatarUrl} alt={p.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      style={{ border: "2px solid rgba(255,255,255,0.2)" }} />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ background: "rgba(145,71,255,0.3)", color: "#bf94ff", border: "1px solid rgba(145,71,255,0.4)" }}>
                        DropBay Partner
                      </span>
                      {p.isLive ? (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded"
                          style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}>
                          <span className="live-dot w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                          AO VIVO
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-2xl md:text-3xl" style={{ color: "#f5f5f7", letterSpacing: "-0.02em" }}>
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-sm mt-1 max-w-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                {p.twitchUrl && (
                  <a href={p.twitchUrl} target="_blank" rel="noopener noreferrer"
                    className="pc-twitch hidden md:flex flex-shrink-0 items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl"
                    style={{ background: "rgba(145,71,255,0.18)", color: "#bf94ff", border: "1px solid rgba(145,71,255,0.35)", transition: "background 0.15s" }}>
                    <ExternalLink size={14} /> Assistir na Twitch
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between mt-5">
            {/* Setas */}
            <div className="flex gap-2">
              <button onClick={prev} className="pc-btn w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", transition: "background 0.15s" }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={next} className="pc-btn w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", transition: "background 0.15s" }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {partners.map((_, i) => (
                <button key={i} onClick={() => go(i)} className="pc-dot-btn rounded-full"
                  style={{
                    width: i === current ? "20px" : "6px",
                    height: "6px",
                    background: i === current ? "#9147ff" : "rgba(255,255,255,0.25)",
                    opacity: i === current ? 1 : 0.6,
                    transition: "all 0.3s",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }} />
              ))}
            </div>

            {/* Link ver todos */}
            <Link href="/nossos-parceiros" className="text-xs font-medium"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
              Ver todos →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
