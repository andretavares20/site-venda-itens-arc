"use client"

import { useEffect, useState, useRef } from "react"
import { Search, X, ChevronDown, Plus, Check, ToggleLeft, ToggleRight } from "lucide-react"
import { TierBadge } from "@/components/tier-badge"

type UserTier = "PARTNER" | "VERIFIED_TRADER" | "ELITE_RIDER"
type Coupon = { id: string; code: string; discountPercent: number; commissionPercent: number; active: boolean }
type User = { id: string; name: string; email: string; tier: UserTier | null; createdAt: string; coupon: Coupon | null }

const TIER_OPTIONS: { value: UserTier | ""; label: string }[] = [
  { value: "", label: "Sem tier" },
  { value: "PARTNER", label: "🛰 DropBay Partner" },
  { value: "VERIFIED_TRADER", label: "✓ Verified Trader" },
  { value: "ELITE_RIDER", label: "⚡ Elite Rider" },
]

export default function AdminUsuarios() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<User | null>(null)
  const [updatingTier, setUpdatingTier] = useState(false)
  const [couponForm, setCouponForm] = useState({ code: "", discountPercent: "0", commissionPercent: "5" })
  const [savingCoupon, setSavingCoupon] = useState(false)
  const [tierDropOpen, setTierDropOpen] = useState(false)
  const tierRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (tierRef.current && !tierRef.current.contains(e.target as Node)) setTierDropOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/admin/usuarios")
    setUsers(await res.json())
    setLoading(false)
  }

  function openUser(user: User) {
    setSelected(user)
    setTierDropOpen(false)
    if (user.coupon) {
      setCouponForm({
        code: user.coupon.code,
        discountPercent: String(user.coupon.discountPercent),
        commissionPercent: String(user.coupon.commissionPercent),
      })
    } else {
      setCouponForm({ code: "", discountPercent: "0", commissionPercent: "5" })
    }
  }

  async function assignTier(userId: string, tier: UserTier | "") {
    setUpdatingTier(true)
    await fetch("/api/admin/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tier: tier || null }),
    })
    setUpdatingTier(false)
    setTierDropOpen(false)
    await load()
    // Refresh selected
    const updated = users.find((u) => u.id === userId)
    if (updated) setSelected({ ...updated, tier: tier || null })
  }

  async function saveCoupon() {
    if (!selected) return
    setSavingCoupon(true)
    await fetch("/api/admin/cupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        riderId: selected.id,
        code: couponForm.code,
        discountPercent: Number(couponForm.discountPercent),
        commissionPercent: Number(couponForm.commissionPercent),
      }),
    })
    setSavingCoupon(false)
    await load()
  }

  async function toggleCoupon(couponId: string, active: boolean) {
    await fetch("/api/admin/cupons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponId, active }),
    })
    await load()
  }

  const filtered = users.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Usuários
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>
            {filtered.length}/{users.length}
          </span>
        </h1>
      </div>

      {/* Busca */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5 max-w-sm"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <input className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--text-primary)" }}
          placeholder="Buscar por nome ou email..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch("")} style={{ color: "var(--text-tertiary)" }}><X size={13} /></button>}
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              {["Usuário", "Tier", "Desde", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12" style={{ color: "var(--text-secondary)" }}>Nenhum usuário</td></tr>
            ) : filtered.map((user, i) => (
              <tr key={user.id} onClick={() => openUser(user)} className="cursor-pointer transition-colors"
                style={{ background: i % 2 === 0 ? "var(--surface-1)" : "var(--bg)", borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? "var(--surface-1)" : "var(--bg)"}>
                <td className="px-4 py-3">
                  <p className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>{user.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  {user.tier ? <TierBadge tier={user.tier} size="xs" /> : (
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--accent)" }}>
                  Editar →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)} />
          <aside className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{ width: "min(420px,100vw)", background: "var(--surface-1)", borderLeft: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--border)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{selected.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <X size={17} />
              </button>
            </div>

            <div className="flex flex-col gap-6 p-6">
              {/* Tier */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>TIER</p>
                <div className="relative" ref={tierRef}>
                  <button onClick={() => setTierDropOpen((v) => !v)} disabled={updatingTier}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    <span>
                      {selected.tier
                        ? TIER_OPTIONS.find((o) => o.value === selected.tier)?.label
                        : "Sem tier"}
                    </span>
                    <ChevronDown size={14} style={{ color: "var(--text-tertiary)" }} />
                  </button>
                  {tierDropOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10"
                      style={{ background: "var(--surface-1)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                      {TIER_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => assignTier(selected.id, opt.value)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left"
                          style={{ color: "var(--text-primary)" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                          {opt.label}
                          {selected.tier === opt.value && <Check size={13} style={{ color: "var(--accent)" }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cupom — só para Elite Riders */}
              {selected.tier === "ELITE_RIDER" && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>CUPOM PERSONALIZADO</p>
                  <div className="rounded-xl p-4 flex flex-col gap-3"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    {selected.coupon && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold" style={{ color: "var(--accent)" }}>
                          {selected.coupon.code}
                        </span>
                        <button onClick={() => toggleCoupon(selected.coupon!.id, !selected.coupon!.active)}
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: selected.coupon.active ? "var(--success)" : "var(--text-tertiary)" }}>
                          {selected.coupon.active
                            ? <><ToggleRight size={16} /> Ativo</>
                            : <><ToggleLeft size={16} /> Inativo</>}
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Código</label>
                      <input value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 rounded-xl text-sm font-mono outline-none"
                        style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                        placeholder="EX: RIDER10" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Desconto comprador (%)</label>
                        <input type="number" min="0" max="5" value={couponForm.discountPercent}
                          onChange={(e) => setCouponForm((f) => ({ ...f, discountPercent: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--text-tertiary)" }}>Comissão rider (%)</label>
                        <input type="number" min="0" max="5" value={couponForm.commissionPercent}
                          onChange={(e) => setCouponForm((f) => ({ ...f, commissionPercent: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                      </div>
                    </div>

                    <button onClick={saveCoupon} disabled={savingCoupon || !couponForm.code}
                      className="btn-primary text-sm w-full">
                      <Plus size={14} />
                      {savingCoupon ? "Salvando..." : selected.coupon ? "Atualizar cupom" : "Criar cupom"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
