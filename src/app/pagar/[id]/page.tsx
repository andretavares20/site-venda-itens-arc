"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/navbar"
import Image from "next/image"
import Link from "next/link"
import { Copy, CheckCircle, QrCode, Clock, XCircle, MessageCircle, Loader2 } from "lucide-react"
import { DISCORD_URL } from "@/lib/constants"

type OrderData = {
  id: string
  total: number
  pixCode: string | null
  pixQrCode: string | null
  pixExpires: string | null
  status: string
}

type PaymentStatus = "loading" | "waiting" | "paid" | "expired" | "error"

const POLL_INTERVAL = 4000

export default function PagarPage() {
  const { id } = useParams<{ id: string }>()
  const { status: sessionStatus } = useSession()
  const router = useRouter()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("loading")
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [copied, setCopied] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopAll = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const startPolling = useCallback((orderId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedidos/${orderId}`)
        const data = await res.json()
        if (data.status === "PAGO") {
          setPaymentStatus("paid")
          stopAll()
          setTimeout(() => router.push(`/pedido/${orderId}`), 3000)
        }
      } catch {}
    }, POLL_INTERVAL)
  }, [router, stopAll])

  const startCountdown = useCallback((expiresAt: string) => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    setSecondsLeft(calc())

    countdownRef.current = setInterval(() => {
      const s = calc()
      setSecondsLeft(s)
      if (s <= 0) {
        setPaymentStatus("expired")
        stopAll()
      }
    }, 1000)
  }, [stopAll])

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login")
      return
    }
    if (sessionStatus !== "authenticated") return

    fetch(`/api/pedidos/${id}`)
      .then(async (res) => {
        if (!res.ok) { setPaymentStatus("error"); return }
        const data: OrderData = await res.json()
        setOrder(data)

        if (data.status === "PAGO") {
          setPaymentStatus("paid")
          setTimeout(() => router.push(`/pedido/${id}`), 3000)
          return
        }

        if (!data.pixCode || !data.pixExpires) { setPaymentStatus("error"); return }

        const remaining = Math.floor((new Date(data.pixExpires).getTime() - Date.now()) / 1000)
        if (remaining <= 0) { setPaymentStatus("expired"); return }

        setPaymentStatus("waiting")
        startCountdown(data.pixExpires)
        startPolling(id)
      })
      .catch(() => setPaymentStatus("error"))

    return () => stopAll()
  }, [id, sessionStatus, router, startPolling, startCountdown, stopAll])

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0")
    const sec = (s % 60).toString().padStart(2, "0")
    return `${m}:${sec}`
  }

  function handleCopy() {
    if (!order?.pixCode) return
    navigator.clipboard.writeText(order.pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  // Loading
  if (paymentStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    )
  }

  // Sucesso
  if (paymentStatus === "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center flex flex-col items-center gap-6 max-w-sm">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(48,209,88,0.15)",
              boxShadow: "0 0 60px rgba(48,209,88,0.3)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          >
            <CheckCircle size={48} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              Pagamento confirmado!
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Seu pedido foi aprovado. Em breve nossa equipe entrará em contato para a entrega.
            </p>
          </div>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm"
            style={{ background: "#5865F2", color: "#fff" }}
          >
            <MessageCircle size={16} />
            Falar no Discord
          </a>
          <div className="w-full flex flex-col gap-2">
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full"
                style={{ background: "var(--success)", width: "100%", animation: "shrink 3s linear forwards" }}
              />
            </div>
            <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
              Redirecionando para o pedido...
            </p>
          </div>
          <style>{`
            @keyframes shrink { from { width: 100% } to { width: 0% } }
            @keyframes pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.05) } }
          `}</style>
        </div>
      </div>
    )
  }

  // Expirado
  if (paymentStatus === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center flex flex-col items-center gap-6 max-w-sm">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,69,58,0.1)" }}>
            <XCircle size={40} style={{ color: "var(--error)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              PIX expirado
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              O tempo de pagamento encerrou.
            </p>
          </div>
          <Link href={`/pedido/${id}`} className="btn-primary">Ver pedido</Link>
        </div>
      </div>
    )
  }

  // Erro
  if (paymentStatus === "error" || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center flex flex-col items-center gap-4 max-w-sm">
          <XCircle size={40} style={{ color: "var(--error)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Não foi possível carregar o pagamento.</p>
          <Link href="/" className="btn-primary">Voltar à loja</Link>
        </div>
      </div>
    )
  }

  const isUrgent = secondsLeft < 300

  // Tela principal do QR Code
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-lg mx-auto text-center">
        <div
          className="rounded-3xl p-8 flex flex-col items-center gap-5"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          {/* Header aguardando */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: "var(--success)",
                  boxShadow: "0 0 8px var(--success)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <span className="text-sm font-medium" style={{ color: "var(--success)" }}>
                Aguardando pagamento
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              R$ {Number(order.total).toFixed(2)}
            </h1>
          </div>

          {/* Countdown */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: isUrgent ? "rgba(255,69,58,0.1)" : "var(--surface-2)",
              color: isUrgent ? "var(--error)" : "var(--text-secondary)",
              border: `1px solid ${isUrgent ? "rgba(255,69,58,0.3)" : "var(--border)"}`,
            }}
          >
            <Clock size={14} />
            Expira em {formatTime(secondsLeft)}
          </div>

          {/* QR Code */}
          {order.pixQrCode && (
            <div className="p-4 rounded-2xl" style={{ background: "#fff" }}>
              <Image
                src={`data:image/png;base64,${order.pixQrCode}`}
                alt="QR Code PIX"
                width={200}
                height={200}
              />
            </div>
          )}

          {/* Código copia e cola */}
          <div className="w-full flex flex-col gap-2">
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Ou copie o código PIX
            </p>
            <div
              className="flex items-center gap-2 rounded-xl p-3"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <p className="flex-1 text-xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>
                {order.pixCode}
              </p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0"
                style={{ background: copied ? "var(--success)" : "var(--accent)", color: "#fff" }}
              >
                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Info */}
          <div
            className="w-full flex items-start gap-2 text-xs p-3 rounded-xl text-left"
            style={{ background: "rgba(0,113,227,0.08)", color: "var(--text-secondary)", border: "1px solid rgba(0,113,227,0.15)" }}
          >
            <QrCode size={14} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
            Assim que o pagamento for confirmado, essa tela atualiza automaticamente.
          </div>

          <Link href={`/pedido/${id}`} className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Ver pedido #{id.slice(-8).toUpperCase()} →
          </Link>

          <style>{`
            @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
          `}</style>
        </div>
      </main>
    </div>
  )
}
