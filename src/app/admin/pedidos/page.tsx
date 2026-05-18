"use client"

import { useEffect, useState } from "react"

type Order = {
  id: string
  total: number
  status: "PENDENTE" | "PAGO" | "ENTREGUE" | "CANCELADO"
  createdAt: string
  user: { name: string; email: string }
  items: { product: { name: string }; quantity: number }[]
}

const statusOptions = ["PENDENTE", "PAGO", "ENTREGUE", "CANCELADO"]

const statusStyle: Record<string, { bg: string; color: string }> = {
  PENDENTE: { bg: "rgba(255,214,10,0.1)", color: "var(--warning)" },
  PAGO: { bg: "rgba(0,113,227,0.1)", color: "var(--accent)" },
  ENTREGUE: { bg: "rgba(48,209,88,0.1)", color: "var(--success)" },
  CANCELADO: { bg: "rgba(255,69,58,0.1)", color: "var(--error)" },
}

export default function AdminPedidos() {
  const [orders, setOrders] = useState<Order[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch("/api/pedidos")
    const data = await res.json()
    setOrders(data)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/pedidos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
        Pedidos
      </h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => {
          const style = statusStyle[order.status] ?? statusStyle.PENDENTE
          return (
            <div
              key={order.id}
              className="rounded-2xl p-5"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {order.user.name} · {order.user.email}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(order.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                    R$ {Number(order.total).toFixed(2)}
                  </span>
                  <select
                    value={order.status}
                    disabled={updating === order.id}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-xl cursor-pointer"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {order.items.map((item, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    {item.product.name} x{item.quantity}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {orders.length === 0 && (
          <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
            Nenhum pedido ainda
          </div>
        )}
      </div>
    </div>
  )
}
