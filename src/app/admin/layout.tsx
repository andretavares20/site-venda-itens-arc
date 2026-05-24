import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import AdminBell from "@/components/admin-bell"
import { AlertTriangle, Package, ShoppingBag, LayoutDashboard, Megaphone, Archive, Users, ArrowLeftRight } from "lucide-react"

const navLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/anuncios", icon: Megaphone, label: "Anúncios" },
  { href: "/admin/estoque", icon: Archive, label: "Estoque" },
  { href: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { href: "/admin/trocas", icon: ArrowLeftRight, label: "Trocas" },
  { href: "/admin/reclamacoes", icon: AlertTriangle, label: "Reclamações" },
  { href: "/admin/produtos", icon: Package, label: "Catálogo" },
  { href: "/admin/usuarios", icon: Users, label: "Usuários" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/")

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <style>{`
        .admin-link {
          color: var(--text-secondary);
          transition: background 0.15s, color 0.15s;
        }
        .admin-link:hover {
          background: var(--surface-2);
          color: var(--text-primary);
        }
      `}</style>
      <aside
        className="w-56 flex-shrink-0 flex flex-col py-6 px-3 gap-1"
        style={{ borderRight: "1px solid var(--border)", background: "var(--surface-1)" }}
      >
        <div className="flex items-center justify-between px-3 mb-4">
          <Link
            href="/"
            className="text-base font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Drop<span style={{ color: "var(--accent)" }}>Bay</span>
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-tertiary)" }}>Admin</span>
          </Link>
          <AdminBell />
        </div>
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="admin-link flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium"
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
