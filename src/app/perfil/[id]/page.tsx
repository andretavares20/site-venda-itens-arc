"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Navbar from "@/components/navbar"
import Link from "next/link"
import { Star, ArrowLeft, Package } from "lucide-react"
import { TierBadge } from "@/components/tier-badge"

type UserTier = "PARTNER" | "VERIFIED_TRADER" | "ELITE_RIDER"

type Review = {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  giver: { name: string }
}

type Profile = {
  id: string
  name: string
  tier: UserTier | null
  createdAt: string
  listings: number
  avgRating: number | null
  reviews: Review[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} style={{ color: i <= rating ? "var(--warning)" : "var(--surface-3)", fill: i <= rating ? "var(--warning)" : "none" }} />
      ))}
    </div>
  )
}

export default function PerfilPage() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/perfil/${id}`)
      .then((r) => r.json())
      .then((data) => { setProfile(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Navbar />
        <div className="w-7 h-7 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
        <Navbar />
        <p style={{ color: "var(--text-secondary)" }}>Perfil não encontrado</p>
        <Link href="/" className="btn-secondary text-sm">Voltar à loja</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
          <ArrowLeft size={15} /> Voltar
        </Link>

        {/* Perfil */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {profile.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {profile.name}
                </h1>
                <TierBadge tier={profile.tier} size="sm" />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {profile.avgRating !== null ? (
                  <div className="flex items-center gap-1.5">
                    <Stars rating={Math.round(profile.avgRating)} />
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {profile.avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      ({profile.reviews.length} avaliação{profile.reviews.length !== 1 ? "ões" : ""})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Sem avaliações ainda</span>
                )}
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>·</span>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Package size={12} />
                  {profile.listings} anúncio{profile.listings !== 1 ? "s" : ""} realizados
                </div>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>·</span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Membro desde {new Date(profile.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Avaliações */}
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Avaliações</h2>

        {profile.reviews.length === 0 ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <Star size={32} style={{ color: "var(--text-tertiary)", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Este usuário ainda não recebeu avaliações
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.reviews.map((review) => (
              <div key={review.id} className="rounded-2xl p-4"
                style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {review.giver.name}
                    </span>
                    <Stars rating={review.rating} />
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
