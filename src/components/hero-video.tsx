"use client"

import { useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  function toggleMute() {
    if (!videoRef.current) return
    const next = !muted
    videoRef.current.muted = next
    setMuted(next)
  }

  return (
    <div className="relative mx-auto" style={{ maxWidth: "900px" }}>
      <div style={{
        maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 100%)",
      }}>
        <video
          ref={videoRef}
          src="/VIDEO ANUNCIO DROPBAY 1920X1080.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full object-cover object-top"
          style={{ maxHeight: "520px" }}
        />
      </div>

      {/* Botão de som */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "Ativar som" : "Silenciar"}
        style={{
          position: "absolute",
          bottom: "52px",
          right: "16px",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.8)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.55)")}
      >
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
    </div>
  )
}
