"use client"

import { useState, useEffect, useCallback } from "react"

type Slide = { src: string; title: string }

export default function Carousel() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/reddit-images")
      .then(r => r.json())
      .then((data: Slide[]) => {
        if (data.length > 0) setSlides(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const next = useCallback(() => {
    if (slides.length > 0) setCurrent(c => (c + 1) % slides.length)
  }, [slides.length])

  const prev = () => {
    if (slides.length > 0) setCurrent(c => (c - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    if (paused || slides.length === 0) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [paused, slides.length, next])

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center"
        style={{ height: "560px", background: "#111" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.5)" }} />
      </div>
    )
  }

  if (slides.length === 0) return null

  const slide = slides[current]

  return (
    <div className="relative w-full overflow-hidden"
      style={{ height: "560px", background: "#000" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* Slides */}
      {slides.map((s, i) => (
        <div key={i} className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}>
          <img src={s.src} alt={s.title}
            className="w-full h-full object-cover"
            style={{ objectPosition: "center" }} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
        </div>
      ))}

      {/* Texto */}
      <div className="absolute bottom-0 left-0 right-0 text-center pb-14 px-8">
        <p className="text-sm font-medium mb-2 transition-all duration-500 line-clamp-2 mx-auto"
          style={{ color: "rgba(255,255,255,0.85)", maxWidth: "600px" }}>
          {slide.title}
        </p>
      </div>

      {/* Seta esquerda */}
      <button onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", cursor: "pointer", backdropFilter: "blur(8px)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      {/* Seta direita */}
      <button onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", cursor: "pointer", backdropFilter: "blur(8px)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s",
              padding: 0,
            }} />
        ))}
      </div>

      {/* Pause */}
      <button onClick={() => setPaused(p => !p)}
        className="absolute bottom-3.5 right-4 flex items-center justify-center rounded-full"
        style={{ width: 28, height: 28, background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", cursor: "pointer", backdropFilter: "blur(8px)" }}>
        {paused
          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          : <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
      </button>

      {/* Badge Reddit */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
        style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
        r/arcraiders
      </div>
    </div>
  )
}
