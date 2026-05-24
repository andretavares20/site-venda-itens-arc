"use client"

import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"

type ListingItem = { product: { name: string } }
type Listing = {
  id: string
  createdAt: string
  seller: { name: string }
  items: ListingItem[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "agora"
  if (mins < 60) return `${mins}m atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return `${Math.floor(hours / 24)}d atrás`
}

export default function AdminBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [listings, setListings] = useState<Listing[]>([])
  const ref = useRef<HTMLDivElement>(null)

  function refresh() {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => {
        setUnread(d.unreadCount ?? 0)
        setListings(d.listings ?? [])
      })
      .catch(() => {})
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function handleOpen() {
    setOpen((v) => !v)
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        aria-label="Notificações"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: open ? "var(--surface-2)" : "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = open ? "var(--surface-2)" : "transparent")}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#e3342f",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          width: "320px",
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          zIndex: 100,
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              Novos anúncios
            </span>
            <Link
              href="/admin/anuncios"
              onClick={() => setOpen(false)}
              style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none" }}
            >
              Ver todos
            </Link>
          </div>

          {listings.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "13px" }}>
              Nenhum anúncio ainda.
            </div>
          ) : (
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {listings.map((l) => (
                <Link
                  key={l.id}
                  href="/admin/anuncios"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    textDecoration: "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", flex: 1 }}>
                      {l.seller.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-tertiary)", flexShrink: 0 }}>
                      {timeAgo(l.createdAt)}
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>
                    {l.items.map((i) => i.product.name).join(", ")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
