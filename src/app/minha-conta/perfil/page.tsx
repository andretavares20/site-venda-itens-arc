"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import { ArrowLeft, CheckCircle, User, Key, Camera } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useRef } from "react"

export default function PerfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [pixKey, setPixKey] = useState("")
  const [name, setName] = useState("")
  const [savedPix, setSavedPix] = useState(false)
  const [savedName, setSavedName] = useState(false)
  const [loadingPix, setLoadingPix] = useState(false)
  const [loadingName, setLoadingName] = useState(false)
  const [discordId, setDiscordId] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const discordStatus = searchParams.get("discord")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    setName(session?.user.name ?? "")
    fetch("/api/usuario/perfil")
      .then((r) => r.json())
      .then((data) => {
        if (data.pixKey) setPixKey(data.pixKey)
        if (data.discordId) setDiscordId(data.discordId)
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl)
      })
  }, [status, session])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)

    // redimensiona para 256×256 no canvas antes de enviar
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new window.Image()
        img.onload = () => {
          const SIZE = 256
          const canvas = document.createElement("canvas")
          canvas.width = SIZE
          canvas.height = SIZE
          const ctx = canvas.getContext("2d")!
          const ratio = Math.min(SIZE / img.width, SIZE / img.height)
          const w = img.width * ratio
          const h = img.height * ratio
          ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h)
          resolve(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.src = ev.target?.result as string
      }
      reader.readAsDataURL(file)
    })

    const res = await fetch("/api/usuario/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    })
    setUploadingAvatar(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? "Erro ao enviar imagem")
      return
    }
    const { url } = await res.json()
    setAvatarUrl(url)
  }

  async function saveName() {
    setLoadingName(true)
    await fetch("/api/usuario/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setLoadingName(false)
    setSavedName(true)
    setTimeout(() => setSavedName(false), 3000)
  }

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

        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          Meu perfil
        </h1>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative flex-shrink-0 rounded-full overflow-hidden"
            style={{ width: 72, height: 72 }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {session?.user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              {uploadingAvatar
                ? <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : <Camera size={18} color="#fff" />}
            </div>
          </button>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Foto de perfil</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>JPG, PNG ou WEBP · máx. 2MB</p>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

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
            <button
              onClick={saveName}
              disabled={!name.trim() || loadingName}
              className="btn-primary w-full text-sm"
            >
              {loadingName ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Salvando...
                </span>
              ) : savedName ? (
                <><CheckCircle size={15} /> Nome salvo!</>
              ) : "Salvar nome"}
            </button>
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

        {/* Discord */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-secondary)" }}>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.027.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Discord</h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            Conecte seu Discord para receber notificações sobre seus anúncios, pedidos e trocas.
          </p>
          {discordStatus === "ok" && (
            <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <CheckCircle size={13} /> Discord conectado com sucesso!
            </p>
          )}
          {discordStatus === "erro" && (
            <p className="text-xs mb-3" style={{ color: "var(--error)" }}>
              Erro ao conectar. Tente novamente.
            </p>
          )}
          {discordId ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ background: "rgba(88,101,242,0.1)", color: "#5865F2", border: "1px solid rgba(88,101,242,0.25)" }}>
              <CheckCircle size={14} />
              Conta Discord conectada
            </div>
          ) : (
            <a href="/api/auth/discord"
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl text-sm font-medium py-2.5"
              style={{ background: "#5865F2", color: "#fff" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.027.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Conectar Discord
            </a>
          )}
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
