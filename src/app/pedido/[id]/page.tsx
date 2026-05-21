import Navbar from "@/components/navbar"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { CheckCircle, Clock, Package, XCircle } from "lucide-react"

type StatusKey = "PENDENTE" | "PAGO" | "ENTREGUE" | "CANCELADO"

const statusConfig: Record<StatusKey, { label: string; icon: LucideIcon; color: string }> = {
  PENDENTE: { label: "Aguardando pagamento", icon: Clock, color: "var(--warning)" },
  PAGO: { label: "Pago — em entrega", icon: CheckCircle, color: "var(--accent)" },
  ENTREGUE: { label: "Entregue", icon: Package, color: "var(--success)" },
  CANCELADO: { label: "Cancelado", icon: XCircle, color: "var(--error)" },
}

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          stock: { include: { product: true } },
        },
      },
    },
  })

  if (!order || order.buyerId !== session.user.id) redirect("/")

  const status = statusConfig[order.status as StatusKey] ?? statusConfig.PENDENTE
  const Icon = status.icon

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="pt-20 pb-16 px-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Pedido #{id.slice(-8).toUpperCase()}
        </h1>

        <div className="flex items-center gap-2 mb-8">
          <Icon size={16} style={{ color: status.color }} />
          <span className="text-sm font-medium" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Itens
            </h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.stock?.product?.name ?? "Item"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    x{item.quantity} · R$ {Number(item.price).toFixed(2)} cada
                  </p>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  R$ {(Number(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 font-semibold">
              <span style={{ color: "var(--text-secondary)" }}>Total</span>
              <span className="text-lg" style={{ color: "var(--text-primary)" }}>
                R$ {Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          {order.status === "PENDENTE" && order.pixCode && (
            <div className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Código PIX
              </h2>
              <p className="text-xs font-mono break-all p-3 rounded-xl"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                {order.pixCode}
              </p>
            </div>
          )}

          <Link href="/loja" className="btn-secondary flex-1 text-sm justify-center">
            Continuar comprando
          </Link>
        </div>
      </main>
    </div>
  )
}
