"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/esqueci-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (res.ok) {
      setSent(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Erro ao enviar email. Tente novamente.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Drop<span style={{ color: "var(--accent)" }}>Bay</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Esqueceu a senha?
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Enviaremos um link para redefinir sua senha
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl p-6 text-center flex flex-col gap-4"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "rgba(0,113,227,0.1)" }}>
              <Mail size={24} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Email enviado!</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Se <strong>{email}</strong> estiver cadastrado, você receberá um link em breve. Verifique também a caixa de spam.
              </p>
            </div>
            <Link href="/login" className="btn-secondary text-sm">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl p-6"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            {error && (
              <div className="text-sm px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)", border: "1px solid rgba(255,69,58,0.2)" }}>
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Enviando...
                </span>
              ) : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs mt-5 transition-colors"
          style={{ color: "var(--text-tertiary)" }}>
          <ArrowLeft size={12} /> Voltar ao login
        </Link>
      </div>
    </div>
  )
}
