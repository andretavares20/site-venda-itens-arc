import { prisma } from "@/lib/db"
import Link from "next/link"
import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react"

export default async function AdminDashboard() {
  const [totalProducts, totalOrders, pendingOrders, paidOrders] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDENTE" } }),
    prisma.order.findMany({ where: { status: "PAGO" }, select: { total: true } }),
  ])

  const revenue = paidOrders.reduce((sum: number, o: { total: unknown }) => sum + Number(o.total), 0)

  const stats = [
    { label: "Produtos ativos", value: totalProducts, icon: Package, color: "var(--accent)" },
    { label: "Total de pedidos", value: totalOrders, icon: ShoppingBag, color: "var(--warning)" },
    { label: "Pedidos pendentes", value: pendingOrders, icon: TrendingUp, color: "var(--error)" },
    { label: "Receita confirmada", value: `R$ ${revenue.toFixed(2)}`, icon: DollarSign, color: "var(--success)" },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-primary)" }}>
        Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}18` }}
            >
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/produtos"
          className="btn-primary"
          style={{ textDecoration: "none" }}
        >
          <Package size={16} /> Gerenciar produtos
        </Link>
        <Link
          href="/admin/pedidos"
          className="btn-secondary"
          style={{ textDecoration: "none" }}
        >
          <ShoppingBag size={16} /> Ver pedidos
        </Link>
      </div>
    </div>
  )
}
