"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import { ArrowLeft, CheckCircle, User, Key } from "lucide-react"

export default function PerfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pixKey, setPixKey] = useState("")
  const [name, setName] = useState("")
  const [savedPix, setSavedPix] = useState(false)
  const [savedName, setSavedName] = useState(false)
  const [loadingPix, setLoadingPix] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    setName(session?.user.name ?? "")
    fetch("/api/usuario/perfil")
      .then((r) => r.json())
      .then((data) => { if (data.pixKey) setPixKey(data.pixKey) })
  }, [status, session])

  async function savePixKey() {
    setLoadingPix(true)
    await fetch("/api/usuario/pix-key", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pixKey }),
    })
    setLoadingPix(false)
    setSavedPix(true)
    setTimeout(() => setSavedPix(false), 3000)
  }

  if (status === "loading" || status === "unauthenticated") return null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-lg mx-auto">
        <Link href="/minha-conta"
          className="flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <ArrowLeft size={15} /> Minha conta
        </Link>

        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
          Meu perfil
        </h1>

        {/* Info da conta */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <User size={15} style={{ color: "var(--text-secondary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Informações da conta
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Nome
              </label>
              <input
                className="input-field text-sm"
                value={name}
                onChange={(e) => { setName(e.target.value); setSavedName(false) }}
                placeholder="Seu nome"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                className="input-field text-sm"
                value={session?.user.email ?? ""}
                disabled
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              />
            </div>
          </div>
        </div>

        {/* Chave PIX */}
        <div className="rounded-2xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Key size={15} style={{ color: "var(--text-secondary)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Chave PIX para recebimentos
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            Necessária para receber pagamentos quando seus itens forem vendidos.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Chave PIX
              </label>
              <input
                className="input-field text-sm"
                placeholder="CPF, email, telefone ou chave aleatória"
                value={pixKey}
                onChange={(e) => { setPixKey(e.target.value); setSavedPix(false) }}
              />
            </div>
            <button
              onClick={savePixKey}
              disabled={!pixKey.trim() || loadingPix}
              className="btn-primary w-full text-sm"
            >
              {loadingPix ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Salvando...
                </span>
              ) : savedPix ? (
                <><CheckCircle size={15} /> Chave PIX salva!</>
              ) : "Salvar chave PIX"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
