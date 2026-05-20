import Link from "next/link"
import { Mail } from "lucide-react"

export default function ConfirmacaoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(0,113,227,0.1)" }}>
          <Mail size={28} style={{ color: "var(--accent)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Verifique seu email
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Enviamos um link de confirmação para o seu email.
          Clique no link para ativar sua conta.
        </p>
        <div className="rounded-2xl p-4 mb-6 text-xs"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          Não recebeu? Verifique a pasta de spam ou crie uma nova conta.
        </div>
        <Link href="/login" className="btn-primary w-full">
          Ir para o login
        </Link>
      </div>
    </div>
  )
}
