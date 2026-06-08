"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, MailCheck } from "lucide-react"

export default function VerificarEmailForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  // Navegadores embutidos de apps (Discord, WhatsApp, Gmail) às vezes não repassam
  // a query string pro useSearchParams a tempo — lemos a URL real como reforço.
  useEffect(() => {
    const fromHook = searchParams.get("token")
    const fromUrl = new URLSearchParams(window.location.search).get("token")
    const found = fromHook || fromUrl
    if (found) setToken(found)
  }, [searchParams])

  async function handleConfirm() {
    setError("")
    setLoading(true)
    const res = await fetch("/api/verificar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push("/login?verificado=1"), 2000)
    } else {
      const data = await res.json().catch(() => ({}))
      if (data.error === "token-expirado") setError("Link expirado. Crie uma nova conta para receber um novo link.")
      else setError("Link de verificação inválido. Solicite um novo cadastro.")
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(48,209,88,0.1)" }}>
            <CheckCircle size={28} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <p className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Email verificado!</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Redirecionando para o login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Drop<span style={{ color: "var(--accent)" }}>Bay</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Confirmar conta
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Falta só um passo para ativar sua conta
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 text-center rounded-2xl p-6"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          {error && (
            <div className="text-sm w-full px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)", border: "1px solid rgba(255,69,58,0.2)" }}>
              {error}
            </div>
          )}

          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,113,227,0.1)" }}>
            <MailCheck size={24} style={{ color: "var(--accent)" }} />
          </div>

          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Clique no botão abaixo para confirmar seu email e ativar sua conta no DropBay.
          </p>

          <button onClick={handleConfirm} disabled={loading || !token} className="btn-primary w-full mt-2">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Confirmando...
              </span>
            ) : "Confirmar meu email"}
          </button>
        </div>
      </div>
    </div>
  )
}
