"use client"

import { useToastStore } from "@/lib/toast-store"
import { CheckCircle, XCircle, Info, X } from "lucide-react"

const config = {
  success: { icon: CheckCircle, color: "var(--success)", bg: "rgba(48,209,88,0.12)", border: "rgba(48,209,88,0.25)" },
  error:   { icon: XCircle,     color: "var(--error)",   bg: "rgba(255,69,58,0.12)", border: "rgba(255,69,58,0.25)" },
  info:    { icon: Info,        color: "var(--accent)",  bg: "rgba(0,113,227,0.12)", border: "rgba(0,113,227,0.25)" },
}

export default function Toaster() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const { icon: Icon, color, bg, border } = config[t.type]
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium pointer-events-auto"
            style={{
              background: bg,
              border: `1px solid ${border}`,
              color: "var(--text-primary)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              minWidth: "260px",
              maxWidth: "380px",
              animation: "slideIn 0.2s ease",
            }}
          >
            <Icon size={16} style={{ color, flexShrink: 0 }} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
