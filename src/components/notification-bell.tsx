"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notificacoes")
      if (res.ok) setNotifications(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    const onFocus = () => fetchNotifications()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [fetchNotifications])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleClick(n: Notification) {
    setOpen(false)
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      )
      await fetch(`/api/notificacoes/${n.id}`, { method: "PATCH" })
    }
    if (n.link) router.push(n.link)
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "agora"
    if (m < 60) return `${m}min atrás`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h atrás`
    return `${Math.floor(h / 24)}d atrás`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors"
        style={{ color: "var(--text-secondary)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--surface-2)"
          e.currentTarget.style.color = "var(--text-primary)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.color = "var(--text-secondary)"
        }}
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
            style={{ background: "var(--error)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            top: "100%",
          }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Notificações
            </span>
            {unreadCount > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(255,69,58,0.15)", color: "var(--error)" }}
              >
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Bell size={28} style={{ color: "var(--text-tertiary)" }} />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="flex flex-col max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex flex-col gap-1 px-4 py-3 text-left transition-colors w-full"
                  style={{
                    background: n.read ? "transparent" : "rgba(0,113,227,0.06)",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    border: "none",
                    borderBottomColor: "var(--border)",
                    borderBottomWidth: "1px",
                    borderBottomStyle: "solid",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = n.read ? "var(--surface-2)" : "rgba(0,113,227,0.12)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = n.read ? "transparent" : "rgba(0,113,227,0.06)")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ background: "var(--accent)" }}
                      />
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {n.body}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
