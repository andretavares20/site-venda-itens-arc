"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Link from "next/link"
import {
  User, ShoppingBag, LogOut, Clock, CheckCircle,
  Package, XCircle, ChevronRight, Zap
} from "lucide-react"

type OrderItem = {
  id: string
  quantity: number
  price: number
  stock: { product: { name: string } }
}

type Order = {
  id: string
  total: number
  status: "PENDENTE" | "PAGO" | "ENTREGUE" | "CANCELADO"
  createdAt: string
  items: OrderItem[]
}

const statusConfig = {
  PENDENTE: { label: "Aguardando pagamento", icon: Clock, color: "var(--warning)", bg: "rgba(255,214,10,0.1)" },
  PAGO: { label: "Pago — em entrega", icon: Zap, color: "var(--accent)", bg: "rgba(0,113,227,0.1)" },
  ENTREGUE: { label: "Entregue", icon: CheckCircle, color: "var(--success)", bg: "rgba(48,209,88,0.1)" },
  CANCELADO: { label: "Cancelado", icon: XCircle, color: "var(--error)", bg: "rgba(255,69,58,0.1)" },
}

export default function MinhaContaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/pedidos")
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  if (status === "loading" || status === "unauthenticated") return null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-3xl mx-auto">

        {/* Header do perfil */}
        <div
          className="flex items-center justify-between p-5 rounded-2xl mb-8"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {session?.user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {session?.user.name}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {session?.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--error)"
              e.currentTarget.style.borderColor = "var(--error)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)"
              e.currentTarget.style.borderColor = "var(--border)"
            }}
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>

        {/* Atalhos */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { href: "/minha-conta/perfil", label: "Meu perfil", desc: "Dados e chave PIX" },
            { href: "/minha-conta/anuncios", label: "Meus anúncios", desc: "Gerencie o que você vende" },
            { href: "/minha-conta/estoque", label: "Meu estoque", desc: "Itens aprovados e disponíveis" },
            { href: "/minha-conta/vendas", label: "Minhas vendas", desc: "Pedidos onde você é vendedor" },
            { href: "/minha-conta/trocas", label: "Minhas trocas", desc: "Trocas que você anunciou" },
            { href: "/minha-conta/encomendas", label: "Encomendas", desc: "Suas encomendas e propostas" },
            { href: "/anunciar", label: "Novo anúncio", desc: "Anuncie um item" },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href}
              className="flex flex-col gap-1 p-4 rounded-2xl transition-all"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{desc}</span>
            </Link>
          ))}
        </div>

        {/* Título */}
        <div className="flex items-center gap-2 mb-5">
          <ShoppingBag size={18} style={{ color: "var(--text-secondary)" }} />
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Meus pedidos
          </h2>
          {orders.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            >
              {orders.length}
            </span>
          )}
        </div>

        {/* Lista de pedidos */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--surface-3)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : orders.length === 0 ? (
          <div
            className="flex flex-col items-center gap-4 py-20 rounded-2xl"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <Package size={40} style={{ color: "var(--text-tertiary)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Você ainda não fez nenhum pedido
            </p>
            <Link href="/" className="btn-primary text-sm" style={{ padding: "0.5rem 1.25rem" }}>
              Explorar loja
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const s = statusConfig[order.status] ?? statusConfig.PENDENTE
              const Icon = s.icon
              return (
                <Link
                  key={order.id}
                  href={`/pedido/${order.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-hover)"
                    e.currentTarget.style.transform = "translateY(-1px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  {/* Ícone de status */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: s.bg }}
                  >
                    <Icon size={18} style={{ color: s.color }} />
                  </div>

                  {/* Info do pedido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        Pedido #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                      {order.items.map((i) => `${i.stock?.product?.name ?? "Item"} x${i.quantity}`).join(" · ")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>

                  {/* Total + arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      R$ {Number(order.total).toFixed(2)}
                    </span>
                    <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Separador */}
        <div className="mt-8 pt-6 flex items-center gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          <User size={14} style={{ color: "var(--text-tertiary)" }} />
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Algum problema com um pedido? Entre em contato pelo WhatsApp.
          </span>
        </div>

      </main>
    </div>
  )
}
