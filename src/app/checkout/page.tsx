"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/navbar"
import { useCart, cartTotal } from "@/store/cart"
import Link from "next/link"
import Image from "next/image"
import { Copy, CheckCircle, QrCode, ArrowLeft, Clock, XCircle, Tag, Loader2 } from "lucide-react"

type PixData = {
  orderId: string
  pixCode: string
  pixQrCode: string
  total: number
}

type CouponData = {
  code: string
  discountPercent: number
  commissionPercent: number
  rider: { name: string }
}

type PaymentStatus = "waiting" | "paid" | "expired"

const POLL_INTERVAL = 4000
const EXPIRY_SECONDS = 30 * 60

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, clear } = useCart()
  const total = cartTotal(items)

  const [loading, setLoading] = useState(false)
  const [pix, setPix] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("waiting")
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS)
  const [couponCode, setCouponCode] = useState("")
  const [coupon, setCoupon] = useState<CouponData | null>(null)
  const [couponError, setCouponError] = useState("")
  const [checkingCoupon, setCheckingCoupon] = useState(false)

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

    countdownRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPaymentStatus("expired")
          stopAll()
          return 0
        }
        return s - 1
      })
    }, 1000)
  }, [router, stopAll])

  useEffect(() => () => stopAll(), [stopAll])

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (items.length === 0 && !pix) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--bg)" }}>
        <Navbar />
        <p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Carrinho vazio</p>
        <Link href="/" className="btn-primary">Ir à loja</Link>
      </div>
    )
  }

  async function checkCoupon() {
    if (!couponCode.trim()) return
    setCheckingCoupon(true)
    setCouponError("")
    setCoupon(null)
    try {
      const res = await fetch(`/api/cupom/${couponCode.trim()}`)
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error || "Cupom inválido"); return }
      setCoupon(data)
    } catch {
      setCouponError("Erro ao verificar cupom")
    } finally {
      setCheckingCoupon(false)
    }
  }

  const discountAmount = coupon ? Math.round(total * (coupon.discountPercent / 100) * 100) / 100 : 0
  const finalTotal = Math.max(0, total - discountAmount)

  async function handlePagar() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ stockId: i.id, quantity: i.quantity, price: i.price })),
          total,
          couponCode: coupon?.code ?? null,
        }),
      })

      const text = await res.text()
      if (!text) throw new Error("Servidor não retornou resposta. Tente novamente.")
      const data = JSON.parse(text)
      if (!res.ok) throw new Error(data.error || "Erro ao criar pedido")

      setPix(data)
      clear()
      startPolling(data.orderId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado")
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!pix) return
    navigator.clipboard.writeText(pix.pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0")
    const sec = (s % 60).toString().padStart(2, "0")
    return `${m}:${sec}`
  }

  // Tela de sucesso
  if (paymentStatus === "paid" && pix) {
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
              Seu pedido foi aprovado. Redirecionando...
            </p>
          </div>
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: "var(--surface-2)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: "var(--success)",
                width: "100%",
                animation: "shrink 3s linear forwards",
              }}
            />
          </div>
          <style>{`
            @keyframes shrink { from { width: 100% } to { width: 0% } }
            @keyframes pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.05) } }
          `}</style>
        </div>
      </div>
    )
  }

  // Tela de expirado
  if (paymentStatus === "expired" && pix) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center flex flex-col items-center gap-6 max-w-sm">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,69,58,0.1)" }}
          >
            <XCircle size={40} style={{ color: "var(--error)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              PIX expirado
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              O tempo de pagamento encerrou. Gere um novo pedido.
            </p>
          </div>
          <Link href="/" className="btn-primary">Voltar à loja</Link>
        </div>
      </div>
    )
  }

  // Tela do QR Code com polling
  if (pix) {
    const isUrgent = secondsLeft < 300
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
                R$ {pix.total.toFixed(2)}
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
            {pix.pixQrCode && (
              <div className="p-4 rounded-2xl" style={{ background: "#fff" }}>
                <Image
                  src={`data:image/png;base64,${pix.pixQrCode}`}
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
                  {pix.pixCode}
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

            <Link
              href={`/pedido/${pix.orderId}`}
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Ver pedido #{pix.orderId.slice(-8).toUpperCase()} →
            </Link>

            <style>{`
              @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
            `}</style>
          </div>
        </main>
      </div>
    )
  }

  // Tela de checkout normal
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
          Finalizar compra
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Resumo</h2>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--surface-2)" }}>
                  <Image src={item.image} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>x{item.quantity}</p>
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  R$ {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 font-semibold" style={{ borderTop: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)" }}>Total</span>
              <span className="text-lg" style={{ color: "var(--text-primary)" }}>R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Pagamento</h2>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "2px solid var(--accent)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: "rgba(0,113,227,0.15)", color: "var(--accent)" }}>
                PIX
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Pix</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Pagamento instantâneo</p>
              </div>
            </div>

            {/* Cupom */}
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: "var(--text-secondary)" }}>
                Cupom de desconto
              </label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); setCouponError("") }}
                  onKeyDown={(e) => e.key === "Enter" && checkCoupon()}
                  placeholder="Código do cupom"
                  className="flex-1 px-3 py-2 rounded-xl text-sm font-mono outline-none"
                  style={{ background: "var(--surface-2)", border: `1px solid ${coupon ? "var(--success)" : couponError ? "var(--error)" : "var(--border)"}`, color: "var(--text-primary)" }}
                />
                <button onClick={checkCoupon} disabled={checkingCoupon || !couponCode.trim()}
                  className="px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  {checkingCoupon ? <Loader2 size={13} className="animate-spin" /> : <Tag size={13} />}
                  Aplicar
                </button>
              </div>
              {coupon && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "var(--success)" }}>
                  <CheckCircle size={12} />
                  Cupom de {coupon.rider.name} aplicado!
                  {coupon.discountPercent > 0 && ` · -${coupon.discountPercent}%`}
                </div>
              )}
              {couponError && (
                <p className="text-xs mt-1" style={{ color: "var(--error)" }}>{couponError}</p>
              )}
            </div>

            {/* Resumo do total */}
            {coupon && discountAmount > 0 && (
              <div className="flex flex-col gap-1 text-sm px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(48,209,88,0.06)", border: "1px solid rgba(48,209,88,0.2)" }}>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                  <span style={{ color: "var(--text-secondary)" }}>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--success)" }}>Desconto ({coupon.discountPercent}%)</span>
                  <span style={{ color: "var(--success)" }}>-R$ {discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1" style={{ borderTop: "1px solid rgba(48,209,88,0.2)" }}>
                  <span style={{ color: "var(--text-primary)" }}>Total</span>
                  <span style={{ color: "var(--text-primary)" }}>R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Logado como: <span style={{ color: "var(--text-primary)" }}>{session?.user.email}</span>
            </div>
            {error && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)" }}>
                {error}
              </div>
            )}
            <button onClick={handlePagar} disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Gerando PIX...
                </span>
              ) : (
                `Gerar PIX · R$ ${finalTotal.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
