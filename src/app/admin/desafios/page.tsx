"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, X, Check } from "lucide-react"

type Challenge = {
  id: string
  title: string
  description: string | null
  active: boolean
}

const empty: Omit<Challenge, "id"> = { title: "", description: "", active: true }

export default function AdminDesafios() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<Challenge, "id"> | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/admin/desafios")
    setChallenges(await res.json())
    setLoading(false)
  }

  function openCreate() {
    setEditId(null)
    setForm({ ...empty })
    setError("")
  }

  function openEdit(c: Challenge) {
    setEditId(c.id)
    setForm({ title: c.title, description: c.description ?? "", active: c.active })
    setError("")
  }

  function closeForm() {
    setForm(null)
    setEditId(null)
    setError("")
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setError("")
    const url    = editId ? `/api/admin/desafios/${editId}` : "/api/admin/desafios"
    const method = editId ? "PUT" : "POST"
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Erro ao salvar")
      return
    }
    closeForm()
    load()
  }

  async function remove(id: string) {
    await fetch(`/api/admin/desafios/${id}`, { method: "DELETE" })
    setDeleteId(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Desafios semanais</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Desafios ativos aparecem como opção na tela de Atividades
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Novo desafio
        </button>
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {editId ? "Editar desafio" : "Novo desafio"}
              </h2>
              <button onClick={closeForm} style={{ color: "var(--text-tertiary)" }}><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Título *</label>
                <input
                  className="input-field w-full text-sm"
                  value={form.title}
                  onChange={(e) => setForm((f) => f && { ...f, title: e.target.value })}
                  placeholder="Ex: Derrotar o boss final" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Descrição</label>
                <textarea
                  className="input-field w-full text-sm resize-none"
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })}
                  placeholder="Detalhes do desafio..." />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Status</label>
                <button
                  onClick={() => setForm((f) => f && { ...f, active: !f.active })}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl"
                  style={{
                    background: form.active ? "var(--success)" : "var(--surface-2)",
                    color: form.active ? "#fff" : "var(--text-secondary)",
                    transition: "background 0.15s",
                  }}>
                  {form.active ? <Check size={13} /> : <X size={13} />}
                  {form.active ? "Ativo" : "Inativo"}
                </button>
              </div>
            </div>

            {error && <p className="text-xs mt-3 px-1" style={{ color: "var(--error)" }}>{error}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={closeForm} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={save} disabled={saving || !form.title.trim()} className="btn-primary flex-1 text-sm">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Remover desafio?</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={() => remove(deleteId)} className="btn-primary flex-1 text-sm" style={{ background: "var(--error)" }}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Carregando...</p>
      ) : challenges.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nenhum desafio cadastrado.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Título</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Descrição</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--border)", background: "var(--surface-1)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{c.title}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>
                      {c.description || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: c.active ? "rgba(48,209,88,0.12)" : "rgba(255,59,48,0.1)",
                        color: c.active ? "var(--success)" : "var(--error)",
                      }}>
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--error)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
