"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, X, Check, ExternalLink } from "lucide-react"

type Partner = {
  id: string
  name: string
  twitchUrl: string | null
  avatarUrl: string | null
  description: string | null
  active: boolean
  order: number
}

const empty: Omit<Partner, "id"> = { name: "", twitchUrl: "", avatarUrl: "", description: "", active: true, order: 0 }

export default function AdminParceiros() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Omit<Partner, "id"> | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [fetchingAvatar, setFetchingAvatar] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/admin/parceiros")
    setPartners(await res.json())
    setLoading(false)
  }

  function openCreate() {
    setEditId(null)
    setForm({ ...empty })
    setError("")
  }

  function openEdit(p: Partner) {
    setEditId(p.id)
    setForm({ name: p.name, twitchUrl: p.twitchUrl ?? "", avatarUrl: p.avatarUrl ?? "", description: p.description ?? "", active: p.active, order: p.order })
    setError("")
  }

  function closeForm() {
    setForm(null)
    setEditId(null)
    setError("")
  }

  async function fetchTwitchAvatar(twitchUrl: string) {
    const match = twitchUrl.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
    if (!match) return
    setFetchingAvatar(true)
    const res = await fetch(`/api/admin/twitch-avatar?username=${match[1]}`)
    setFetchingAvatar(false)
    if (!res.ok) return
    const data = await res.json()
    setForm((f) => f && { ...f, avatarUrl: data.avatarUrl, name: f.name || data.displayName })
  }

  async function save() {
    if (!form) return
    setSaving(true)
    setError("")
    const url  = editId ? `/api/admin/parceiros/${editId}` : "/api/admin/parceiros"
    const method = editId ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Erro ao salvar"); return }
    closeForm()
    load()
  }

  async function remove(id: string) {
    await fetch(`/api/admin/parceiros/${id}`, { method: "DELETE" })
    setDeleteId(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Parceiros</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Gerencie os parceiros exibidos na página pública</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Novo parceiro
        </button>
      </div>

      {/* Modal de criação/edição */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>{editId ? "Editar parceiro" : "Novo parceiro"}</h2>
              <button onClick={closeForm} style={{ color: "var(--text-tertiary)" }}><X size={18} /></button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Nome *</label>
                <input className="input-field w-full text-sm" value={form.name}
                  onChange={(e) => setForm((f) => f && { ...f, name: e.target.value })}
                  placeholder="Ex: Thordumal" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>URL da Twitch</label>
                <input className="input-field w-full text-sm" value={form.twitchUrl ?? ""}
                  onChange={(e) => setForm((f) => f && { ...f, twitchUrl: e.target.value })}
                  onBlur={(e) => e.target.value && fetchTwitchAvatar(e.target.value)}
                  placeholder="https://www.twitch.tv/usuario" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  URL do avatar
                  {fetchingAvatar && <span className="text-xs" style={{ color: "var(--accent)" }}>Buscando da Twitch...</span>}
                  {!fetchingAvatar && form.avatarUrl && (
                    <img src={form.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                </label>
                <input className="input-field w-full text-sm" value={form.avatarUrl ?? ""}
                  onChange={(e) => setForm((f) => f && { ...f, avatarUrl: e.target.value })}
                  placeholder="Preenchido automaticamente via Twitch" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Descrição</label>
                <textarea className="input-field w-full text-sm resize-none" rows={2} value={form.description ?? ""}
                  onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })}
                  placeholder="Bio curta do parceiro..." />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-secondary)" }}>Ordem</label>
                  <input className="input-field w-full text-sm" type="number" value={form.order}
                    onChange={(e) => setForm((f) => f && { ...f, order: Number(e.target.value) })} />
                </div>
                <div className="flex items-end pb-1">
                  <button onClick={() => setForm((f) => f && { ...f, active: !f.active })}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
                    style={{ background: form.active ? "var(--success)" : "var(--surface-2)", color: form.active ? "#fff" : "var(--text-secondary)", transition: "background 0.15s" }}>
                    {form.active ? <Check size={14} /> : <X size={14} />}
                    {form.active ? "Ativo" : "Inativo"}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-xs mt-3 px-1" style={{ color: "var(--error)" }}>{error}</p>}

            <div className="flex gap-2 mt-5">
              <button onClick={closeForm} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary flex-1 text-sm">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Remover parceiro?</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={() => remove(deleteId)} className="btn-primary flex-1 text-sm" style={{ background: "var(--error)" }}>Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Carregando...</p>
      ) : partners.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Nenhum parceiro cadastrado ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Parceiro</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Twitch</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>Ordem</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border)", background: "var(--surface-1)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--surface-2)", color: "var(--text-tertiary)" }}>
                          {p.name[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                        {p.description && <p className="text-xs truncate max-w-xs" style={{ color: "var(--text-tertiary)" }}>{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.twitchUrl ? (
                      <a href={p.twitchUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs" style={{ color: "#9147ff" }}>
                        <ExternalLink size={11} /> {p.twitchUrl.replace("https://www.twitch.tv/", "")}
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: p.active ? "rgba(48,209,88,0.12)" : "rgba(255,59,48,0.1)", color: p.active ? "var(--success)" : "var(--error)" }}>
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>{p.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg" style={{ color: "var(--text-secondary)" }}
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
