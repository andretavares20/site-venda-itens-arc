"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type Props = {
  orderId: string
  buyerReceived: boolean
  canComplain: boolean
  hasOpenComplaint: boolean
}

export default function OrderActions({ orderId, buyerReceived, canComplain, hasOpenComplaint }: Props) {
  const router = useRouter()
  const [loadingReceive, setLoadingReceive] = useState(false)
  const [showComplaint, setShowComplaint] = useState(false)
  const [description, setDescription] = useState("")
  const [loadingComplaint, setLoadingComplaint] = useState(false)
  const [error, setError] = useState("")

  async function handleReceive() {
    setLoadingReceive(true)
    const res = await fetch(`/api/pedidos/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "receber" }),
    })
    setLoadingReceive(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Erro ao confirmar recebimento")
    }
  }

  async function handleComplaint() {
    if (!description.trim()) { setError("Descreva o problema"); return }
    setLoadingComplaint(true)
    const res = await fetch("/api/reclamacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, role: "COMPRADOR", description }),
    })
    setLoadingComplaint(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Erro ao abrir reclamação")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-xs px-3 py-2 rounded-xl" style={{ background: "rgba(255,69,58,0.1)", color: "var(--error)" }}>
          {error}
        </p>
      )}

      {/* Confirmar recebimento */}
      {!buyerReceived && (
        <button onClick={handleReceive} disabled={loadingReceive}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ background: "var(--success)", color: "#fff" }}>
          <CheckCircle size={16} />
          {loadingReceive ? "Confirmando..." : "Confirmar recebimento do item"}
        </button>
      )}

      {/* Abrir reclamação */}
      {canComplain && !showComplaint && (
        <button onClick={() => setShowComplaint(true)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-sm font-medium"
          style={{ background: "var(--surface-1)", color: "var(--warning)", border: "1px solid rgba(255,214,10,0.3)" }}>
          <AlertTriangle size={14} />
          Tive um problema — abrir reclamação
        </button>
      )}

      {hasOpenComplaint && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,214,10,0.08)", color: "var(--warning)", border: "1px solid rgba(255,214,10,0.2)" }}>
          <AlertTriangle size={12} />
          Você já tem uma reclamação aberta neste pedido
        </div>
      )}

      {/* Formulário de reclamação */}
      {showComplaint && (
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "var(--surface-1)", border: "1px solid rgba(255,214,10,0.3)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
            Descreva o problema
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Ex: não consigo contato com o vendedor, recebi um item errado, etc.
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o que aconteceu..."
            rows={4}
            className="w-full text-sm p-3 rounded-xl resize-none outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowComplaint(false); setError("") }}
              className="flex-1 py-2 rounded-xl text-sm"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
              Cancelar
            </button>
            <button onClick={handleComplaint} disabled={loadingComplaint}
              className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: "var(--warning)", color: "#000" }}>
              {loadingComplaint ? "Enviando..." : "Enviar reclamação"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
