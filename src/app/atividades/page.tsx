"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Clock, Plus, X } from "lucide-react"
import { toast } from "sonner"

type SlotMember = {
  id: string
  userId: string
  user: { id: string; name: string; discordId: string | null }
}

type Slot = {
  id: string
  userId: string
  user: { id: string; name: string; discordId: string | null }
  activity: string
  challengeId: string | null
  challenge: { id: string; title: string } | null
  scheduledAt: string | null
  status: string
  members: SlotMember[]
}

type Challenge = {
  id: string
  title: string
  description: string | null
  active: boolean
}

const ACTIVITIES = [
  { value: "SUBIR_LEVEL",    label: "Subir level",        emoji: "⬆️", description: "Bancadas e galinha" },
  { value: "FARM_XP",        label: "Farm de XP",          emoji: "⚡", description: null },
  { value: "COLECOES",       label: "Coletâneas",          emoji: "📚", description: "Concluir coletâneas" },
  { value: "DESAFIOS_SEMANAIS", label: "Desafios semanais", emoji: "🎯", description: null },
  { value: "PROJETOS",       label: "Projetos",            emoji: "🔧", description: "Concluir projetos" },
]

const ACTIVITY_MAP = Object.fromEntries(ACTIVITIES.map((a) => [a.value, a]))

export default function AtividadesPage() {
  const { data: session } = useSession()
  const [slots, setSlots] = useState<Slot[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("TODOS")
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ activity: "SUBIR_LEVEL", challengeId: "", time: "" })
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [sRes, cRes] = await Promise.all([
      fetch("/api/atividades"),
      fetch("/api/admin/desafios"),
    ])
    if (sRes.ok) setSlots(await sRes.json())
    if (cRes.ok) {
      const all: Challenge[] = await cRes.json()
      setChallenges(all.filter((c) => c.active))
    }
    setLoading(false)
  }

  async function createSlot() {
    setSubmitting(true)

    let scheduledAt: string | undefined
    if (form.time) {
      const [h, m] = form.time.split(":")
      const d = new Date()
      d.setHours(parseInt(h), parseInt(m), 0, 0)
      scheduledAt = d.toISOString()
    }

    const res = await fetch("/api/atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity: form.activity,
        challengeId: form.challengeId || undefined,
        scheduledAt,
      }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Erro ao publicar")
      return
    }
    setShowModal(false)
    setForm({ activity: "SUBIR_LEVEL", challengeId: "", time: "" })
    toast.success("Você está disponível!")
    load()
  }

  async function cancelSlot(id: string) {
    setActionLoading(id)
    await fetch(`/api/atividades/${id}`, { method: "DELETE" })
    setActionLoading(null)
    toast.success("Grupo fechado")
    load()
  }

  async function joinSlot(id: string) {
    setActionLoading(id)
    const res = await fetch(`/api/atividades/${id}/entrar`, { method: "POST" })
    setActionLoading(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      toast.error(d.error ?? "Erro ao entrar no grupo")
      return
    }
    toast.success("Entrou no grupo! Verifique seu Discord.")
    load()
  }

  async function leaveSlot(id: string) {
    setActionLoading(id)
    await fetch(`/api/atividades/${id}/sair`, { method: "DELETE" })
    setActionLoading(null)
    toast.success("Você saiu do grupo")
    load()
  }

  const filtered = activeTab === "TODOS" ? slots : slots.filter((s) => s.activity === activeTab)

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-14">

        {/* Header */}
        <div className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Atividades</h1>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  Encontre jogadores para fazer atividades juntos
                </p>
              </div>
              {session && (
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
                  <Plus size={14} /> Estou disponível
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {[{ value: "TODOS", label: "Todos", emoji: "" }, ...ACTIVITIES].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: activeTab === tab.value ? "var(--accent)" : "var(--surface-2)",
                    color: activeTab === tab.value ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {tab.emoji ? `${tab.emoji} ${tab.label}` : tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          {loading ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Carregando...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl mb-2">🎮</p>
              <p className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Nenhum jogador disponível
              </p>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                Seja o primeiro a se colocar disponível!
              </p>
              {session && (
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
                  <Plus size={14} /> Estou disponível
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((slot) => {
                const isOwner = session?.user.id === slot.userId
                const isMember = slot.members.some((m) => m.userId === session?.user?.id)
                const totalMembers = 1 + slot.members.length
                const isFull = slot.status === "CHEIO"
                const activity = ACTIVITY_MAP[slot.activity]

                return (
                  <div
                    key={slot.id}
                    className="rounded-2xl p-4 flex flex-col gap-3"
                    style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: "var(--accent)", color: "#fff" }}
                      >
                        {slot.user.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                          {slot.user.name}
                          {isOwner && (
                            <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>
                              (você)
                            </span>
                          )}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                          {activity?.emoji} {activity?.label}
                          {slot.challenge && ` — ${slot.challenge.title}`}
                        </p>
                      </div>
                    </div>

                    {/* Members count */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <Clock size={11} />
                        {slot.scheduledAt
                          ? new Date(slot.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                          : "Disponível hoje"}
                      </div>
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              background: i < totalMembers ? "var(--accent)" : "var(--surface-2)",
                              border: "1px solid var(--border)",
                            }}
                          />
                        ))}
                        <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>
                          {totalMembers}/3
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    {session ? (
                      isOwner ? (
                        <button
                          onClick={() => cancelSlot(slot.id)}
                          disabled={actionLoading === slot.id}
                          className="btn-secondary text-xs w-full"
                          style={{ color: "var(--error)" }}
                        >
                          {actionLoading === slot.id ? "..." : "Fechar grupo"}
                        </button>
                      ) : isMember ? (
                        <button
                          onClick={() => leaveSlot(slot.id)}
                          disabled={actionLoading === slot.id}
                          className="btn-secondary text-xs w-full"
                        >
                          {actionLoading === slot.id ? "..." : "Sair do grupo"}
                        </button>
                      ) : isFull ? (
                        <button disabled className="btn-secondary text-xs w-full opacity-40">
                          Grupo cheio
                        </button>
                      ) : (
                        <button
                          onClick={() => joinSlot(slot.id)}
                          disabled={actionLoading === slot.id}
                          className="btn-primary text-xs w-full"
                        >
                          {actionLoading === slot.id ? "..." : "Entrar no grupo"}
                        </button>
                      )
                    ) : (
                      <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                        Faça login para entrar no grupo
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal criar slot */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Estou disponível para...
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-tertiary)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Activity */}
              <div className="flex flex-col gap-1.5">
                {ACTIVITIES.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setForm((f) => ({ ...f, activity: a.value, challengeId: "" }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                    style={{
                      background: form.activity === a.value ? "rgba(0,113,227,0.12)" : "var(--surface-2)",
                      border: `1px solid ${form.activity === a.value ? "var(--accent)" : "transparent"}`,
                      color: form.activity === a.value ? "var(--accent)" : "var(--text-primary)",
                    }}
                  >
                    <span className="text-base">{a.emoji}</span>
                    <div>
                      <p className="font-medium leading-none">{a.label}</p>
                      {a.description && (
                        <p className="text-xs mt-0.5 opacity-60">{a.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Challenge select */}
              {form.activity === "DESAFIOS_SEMANAIS" && (
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                    Desafio
                  </label>
                  {challenges.length === 0 ? (
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Nenhum desafio disponível esta semana
                    </p>
                  ) : (
                    <select
                      className="input-field w-full text-sm"
                      value={form.challengeId}
                      onChange={(e) => setForm((f) => ({ ...f, challengeId: e.target.value }))}
                    >
                      <option value="">Selecione um desafio</option>
                      {challenges.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Time */}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>
                  Horário <span style={{ color: "var(--text-tertiary)" }}>(opcional)</span>
                </label>
                <input
                  type="time"
                  className="input-field w-full text-sm"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">
                Cancelar
              </button>
              <button
                onClick={createSlot}
                disabled={submitting || (form.activity === "DESAFIOS_SEMANAIS" && !form.challengeId)}
                className="btn-primary flex-1 text-sm"
              >
                {submitting ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
