"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Bell, CheckCheck } from "lucide-react"

type Notification = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "agora"
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d atrás`
  return new Date(date).toLocaleDateString("pt-BR")
}

export default function NotificacoesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/notificacoes")
      .then((r) => r.json())
      .then((data) => { setNotifications(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  async function markAllRead() {
    await fetch("/api/notificacoes", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      await fetch(`/api/notificacoes/${n.id}`, { method: "PATCH" })
    }
    if (n.link) router.push(n.link)
  }

  if (status === "loading" || status === "unauthenticated") return null

  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Notificações</h1>
            {unread > 0 && (
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {unread} não lida{unread > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ color: "var(--accent)", background: "rgba(0,113,227,0.08)", border: "1px solid rgba(0,113,227,0.2)" }}>
              <CheckCheck size={13} />
              Marcar todas como lidas
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 rounded-2xl"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <Bell size={36} style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Nenhuma notificação ainda</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {notifications.map((n, i) => (
              <button key={n.id} onClick={() => handleClick(n)}
                className="w-full flex items-start gap-3 px-4 py-4 text-left"
                style={{
                  background: n.read ? "var(--surface-1)" : "rgba(0,113,227,0.06)",
                  borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: n.link ? "pointer" : "default",
                }}
                onMouseEnter={(e) => { if (n.link) e.currentTarget.style.background = n.read ? "var(--surface-2)" : "rgba(0,113,227,0.1)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "var(--surface-1)" : "rgba(0,113,227,0.06)" }}>
                <div className="flex-shrink-0 mt-0.5">
                  {!n.read && <span className="w-2 h-2 rounded-full block" style={{ background: "var(--accent)" }} />}
                  {n.read && <span className="w-2 h-2 rounded-full block" style={{ background: "transparent" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{n.body}</p>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
