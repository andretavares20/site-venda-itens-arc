"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"

type Props = {
  orderId: string
  sellers: { id: string; name: string }[]
}

export default function ReviewForm({ orderId, sellers }: Props) {
  const router = useRouter()
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [hovers, setHovers] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<Record<string, string>>({})

  async function submit(sellerId: string, sellerName: string) {
    const rating = ratings[sellerId]
    if (!rating) {
      setError((p) => ({ ...p, [sellerId]: "Selecione uma nota de 1 a 5." }))
      return
    }
    setLoading((p) => ({ ...p, [sellerId]: true }))
    setError((p) => ({ ...p, [sellerId]: "" }))

    const res = await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        receiverId: sellerId,
        rating,
        comment: comments[sellerId] || undefined,
        type: "COMPRADOR_PARA_VENDEDOR",
      }),
    })

    setLoading((p) => ({ ...p, [sellerId]: false }))

    if (res.ok) {
      setSubmitted((p) => ({ ...p, [sellerId]: true }))
      router.refresh()
    } else {
      const data = await res.json()
      setError((p) => ({ ...p, [sellerId]: data.error ?? "Erro ao enviar." }))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {sellers.map(({ id: sellerId, name: sellerName }) => {
        if (submitted[sellerId]) {
          return (
            <div
              key={sellerId}
              className="rounded-2xl p-5 flex items-center gap-3"
              style={{ background: "rgba(48,209,88,0.08)", border: "1px solid rgba(48,209,88,0.25)" }}
            >
              <Star size={18} fill="var(--success)" style={{ color: "var(--success)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                  Avaliação enviada!
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Obrigado por avaliar {sellerName}.
                </p>
              </div>
            </div>
          )
        }

        const currentRating = ratings[sellerId] ?? 0
        const currentHover = hovers[sellerId] ?? 0

        return (
          <div
            key={sellerId}
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Avalie {sellerName}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Como foi sua experiência com este vendedor?
              </p>
            </div>

            {/* Estrelas */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (currentHover || currentRating)
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatings((p) => ({ ...p, [sellerId]: star }))}
                    onMouseEnter={() => setHovers((p) => ({ ...p, [sellerId]: star }))}
                    onMouseLeave={() => setHovers((p) => ({ ...p, [sellerId]: 0 }))}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                  >
                    <Star
                      size={28}
                      fill={active ? "#FFD60A" : "transparent"}
                      style={{
                        color: active ? "#FFD60A" : "var(--text-tertiary)",
                        transition: "color 0.1s, fill 0.1s",
                      }}
                    />
                  </button>
                )
              })}
              {currentRating > 0 && (
                <span className="text-xs ml-2" style={{ color: "var(--text-secondary)" }}>
                  {["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][currentRating]}
                </span>
              )}
            </div>

            {/* Comentário */}
            <textarea
              rows={3}
              placeholder="Deixe um comentário (opcional)..."
              value={comments[sellerId] ?? ""}
              onChange={(e) => setComments((p) => ({ ...p, [sellerId]: e.target.value }))}
              className="w-full rounded-xl p-3 text-sm resize-none outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />

            {error[sellerId] && (
              <p className="text-xs" style={{ color: "var(--error)" }}>{error[sellerId]}</p>
            )}

            <button
              onClick={() => submit(sellerId, sellerName)}
              disabled={loading[sellerId]}
              className="btn-primary text-sm self-start"
              style={{ padding: "0.5rem 1.25rem", opacity: loading[sellerId] ? 0.6 : 1 }}
            >
              {loading[sellerId] ? "Enviando..." : "Enviar avaliação"}
            </button>
          </div>
        )
      })}
    </div>
  )
}
