"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import Image from "next/image"
import { Plus, Clock, CheckCircle, XCircle, ShoppingBag, Package, MessageCircle, AlertCircle } from "lucide-react"
import Dialog from "@/components/dialog"

type ListingItem = {
  id: string
  quantity: number
  price: number
  status: string
  product: { name: string; image: string; rarity: string }
}

type Listing = {
  id: string
  status: string
  adminNotes: string | null
  createdAt: string
  items: ListingItem[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDENTE_ENTREGA:         { label: "Pendente entrega pra ADM", color: "var(--warning)",  bg: "rgba(255,214,10,0.1)",   icon: Clock },
  DISPONIVEL:               { label: "Disponível na loja",       color: "var(--success)",  bg: "rgba(48,209,88,0.1)",    icon: CheckCircle },
  PARCIALMENTE_VENDIDO:     { label: "Parcialmente vendido",     color: "var(--accent)",   bg: "rgba(0,113,227,0.1)",    icon: ShoppingBag },
  VENDIDO:                  { label: "Vendido",                  color: "var(--success)",  bg: "rgba(48,209,88,0.1)",    icon: CheckCircle },
  CANCELAMENTO_SOLICITADO:  { label: "Cancelamento — taxa pendente", color: "var(--warning)", bg: "rgba(255,214,10,0.1)", icon: AlertCircle },
  CANCELADO:                { label: "Cancelado",                color: "var(--error)",    bg: "rgba(255,69,58,0.1)",    icon: XCircle },
}

const rarityColor: Record<string, string> = {
  Common: "#98989f", Uncommon: "#30d158", Rare: "#0071e3", Epic: "#bf5af2", Legendary: "#ffd60a",
}

export default function MeusAnunciosPage() {
  const { status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showDiscord, setShowDiscord] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const confirmListing = confirmId ? listings.find((l) => l.id === confirmId) : null
  const hasFee = confirmListing?.status === "DISPONIVEL"

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/anuncios?mine=1")
      .then((r) => r.json())
      .then((data) => { setListings(data); setLoading(false) })
  }, [status])

  function startCancelPolling(listingId: string) {
    stopPolling()
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/anuncios/${listingId}`)
      const data = await res.json()
      if (data.status === "CANCELADO") {
        stopPolling()
        setPixData(null)
        setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: "CANCELADO" } : l))
      }
    }, 4000)
  }

  async function handleCancel(id: string) {
    setConfirmId(null)
    setCancelling(id)
    const res = await fetch(`/api/anuncios/${id}/cancelar`, { method: "POST" })
    const data = await res.json()
    setCancelling(null)

    if (data.type === "imediato") {
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "CANCELADO" } : l))
    } else if (data.type === "discord") {
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: "CANCELAMENTO_SOLICITADO" } : l))
      setShowDiscord(true)
    }
  }

  if (status === "loading" || status === "unauthenticated") return null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Meus anúncios</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Gerencie os itens que você colocou à venda
            </p>
          </div>
          <Link href="/anunciar" className="btn-primary text-sm">
            <Plus size={15} /> Novo anúncio
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 rounded-2xl text-center"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <Package size={40} style={{ color: "var(--text-tertiary)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Você ainda não criou nenhum anúncio</p>
            <Link href="/anunciar" className="btn-primary text-sm">Criar primeiro anúncio</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {listings.map((listing) => {
              const s = statusConfig[listing.status] ?? statusConfig.PENDENTE_ENTREGA
              const Icon = s.icon
              const canCancel = listing.status === "PENDENTE_ENTREGA" || listing.status === "DISPONIVEL"
              return (
                <div key={listing.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        #{listing.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        <Icon size={11} />
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {new Date(listing.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      {canCancel && (
                        <button
                          onClick={() => setConfirmId(listing.id)}
                          disabled={cancelling === listing.id}
                          className="text-xs px-3 py-1 rounded-full transition-colors"
                          style={{ color: "var(--error)", border: "1px solid rgba(255,69,58,0.3)" }}
                        >
                          {cancelling === listing.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  {listing.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-3"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                        style={{ background: "#0d0d0d" }}>
                        <Image src={item.product.image} alt={item.product.name}
                          width={40} height={40} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {item.product.name}
                        </p>
                        <p className="text-xs" style={{ color: rarityColor[item.product.rarity] ?? "#98989f" }}>
                          {item.product.rarity} · x{item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          R$ {Number(item.price).toFixed(2)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--success)" }}>
                          Você recebe: R$ {(Number(item.price) * 0.9).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {listing.adminNotes && (
                    <div className="px-5 py-3 text-xs" style={{ color: "var(--text-secondary)", background: "rgba(0,113,227,0.05)" }}>
                      <span style={{ color: "var(--accent)" }}>Admin: </span>{listing.adminNotes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal PIX taxa de cancelamento */}
      {pixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col items-center gap-5"
            style={{ background: "rgba(30,30,32,0.97)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle size={32} style={{ color: "var(--warning)" }} />
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Taxa de cancelamento
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Pague a taxa de <strong style={{ color: "var(--text-primary)" }}>R$ {pixData.fee.toFixed(2)}</strong> para confirmar o cancelamento. Seu item será devolvido após confirmação do pagamento.
              </p>
            </div>

            {pixData.pixQrCode && (
              <div className="p-3 rounded-xl" style={{ background: "#fff" }}>
                <Image src={`data:image/png;base64,${pixData.pixQrCode}`} alt="QR Code" width={160} height={160} />
              </div>
            )}

            <div className="w-full flex items-center gap-2 p-3 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <p className="flex-1 text-xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>
                {pixData.pixCode}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(pixData.pixCode)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Copy size={11} /> Copiar
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs"
              style={{ color: "var(--text-secondary)" }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: "var(--success)", boxShadow: "0 0 6px var(--success)", animation: "pulse 1.5s ease-in-out infinite" }} />
              Aguardando confirmação do pagamento...
            </div>

            <button onClick={() => { setPixData(null); stopPolling() }} className="btn-secondary w-full text-sm">
              Fechar e verificar depois
            </button>

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>
        </div>
      )}

      {/* Modal Discord — cancelamento de item disponível */}
      <Dialog
        open={showDiscord}
        title="Cancelamento solicitado"
        message="Seu item está com a administração. Entre em contato no Discord para combinarmos a devolução."
        onClose={() => setShowDiscord(false)}
        actions={[
          {
            label: "Abrir Discord",
            variant: "default",
            onClick: () => { window.open("https://discord.gg/W6PMjDwa", "_blank"); setShowDiscord(false) },
          },
          {
            label: "Fechar",
            variant: "cancel",
            onClick: () => setShowDiscord(false),
          },
        ]}
      />

      <Dialog
        open={!!confirmId}
        title="Cancelar anúncio?"
        message={
          hasFee
            ? "Como o item está disponível na loja, o cancelamento será solicitado e você deve entrar em contato no Discord para devolvermos o item."
            : "Como o item ainda não foi entregue à administração, o cancelamento é gratuito e imediato."
        }
        onClose={() => setConfirmId(null)}
        actions={[
          {
            label: "Cancelar anúncio",
            variant: "destructive",
            loading: !!cancelling,
            onClick: () => confirmId && handleCancel(confirmId),
          },
          {
            label: "Voltar",
            variant: "cancel",
            onClick: () => setConfirmId(null),
          },
        ]}
      />
    </div>
  )
}
