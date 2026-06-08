"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, CheckCircle } from "lucide-react"

export default function RedefinirSenhaForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) setError("Link inválido. Solicite um novo link de redefinição.")
    else setError("")
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("As senhas não coincidem."); return }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return }
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/redefinir-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push("/login?redefinido=1"), 2500)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Erro ao redefinir senha. Tente novamente.")
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
            <p className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Senha redefinida!</p>
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
            Nova senha
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Escolha uma senha segura
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl p-6"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          {error && (
            <div className="text-sm px-4 py-3 rounded-xl"
              style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)", border: "1px solid rgba(255,69,58,0.2)" }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Nova senha</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="input-field"
                style={{ paddingRight: "2.75rem" }}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-tertiary)" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Confirmar senha</label>
            <input
              type={showPass ? "text" : "password"}
              className="input-field"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" disabled={loading || !token} className="btn-primary w-full mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Salvando...
              </span>
            ) : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  )
}
