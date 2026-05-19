"use client"

import { useEffect } from "react"

type Action = {
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "cancel"
  loading?: boolean
}

type Props = {
  open: boolean
  title: string
  message: string
  actions: Action[]
  onClose: () => void
}

export default function Dialog({ open, title, message, actions, onClose }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  const variantStyle = (variant: Action["variant"]) => {
    if (variant === "destructive") return { color: "var(--error)", fontWeight: 600 }
    if (variant === "cancel") return { color: "var(--text-secondary)", fontWeight: 400 }
    return { color: "var(--accent)", fontWeight: 600 }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "rgba(30,30,32,0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Texto */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h2
            className="text-base font-semibold mb-1.5"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
        </div>

        {/* Ações — separador + botões empilhados */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              disabled={action.loading}
              className="w-full py-3.5 text-sm transition-colors"
              style={{
                ...variantStyle(action.variant),
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : undefined,
                background: "transparent",
                opacity: action.loading ? 0.5 : 1,
                cursor: action.loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              {action.loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-current opacity-30 border-t-current animate-spin" />
                  {action.label}
                </span>
              ) : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
