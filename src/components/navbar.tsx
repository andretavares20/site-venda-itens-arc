"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ShoppingCart, User, Shield, LogOut, Menu, X } from "lucide-react"
import { useCart, cartCount } from "@/store/cart"
import { useState } from "react"
import CartDrawer from "./cart-drawer"

export default function Navbar() {
  const { data: session } = useSession()
  const items = useCart((s) => s.items)
  const count = cartCount(items)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Arc<span style={{ color: "var(--accent)" }}>Store</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/anunciar"
              className="text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Anunciar
            </Link>
            <Link
              href="/trocas"
              className="text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Trocas
            </Link>
            <Link
              href="/"
              className="text-sm transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              Loja
            </Link>
            {session?.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-sm flex items-center gap-1 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-secondary)")
                }
              >
                <Shield size={14} />
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)"
                e.currentTarget.style.color = "var(--text-primary)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "var(--text-secondary)"
              }}
              aria-label="Carrinho"
            >
              <ShoppingCart size={20} />
              {count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                  style={{ background: "var(--accent)" }}
                >
                  {count}
                </span>
              )}
            </button>

            {session ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/minha-conta"
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-2)"
                    e.currentTarget.style.color = "var(--text-primary)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "var(--text-secondary)"
                  }}
                >
                  <User size={14} />
                  {session.user.name?.split(" ")[0]}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-2)"
                    e.currentTarget.style.color = "var(--text-primary)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "var(--text-secondary)"
                  }}
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex btn-primary text-sm"
                style={{ padding: "0.375rem 1rem" }}
              >
                Entrar
              </Link>
            )}

            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="md:hidden px-4 pb-4 flex flex-col gap-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Link
              href="/"
              className="py-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMenuOpen(false)}
            >
              Loja
            </Link>
            {session?.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="py-2 text-sm flex items-center gap-1"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => setMenuOpen(false)}
              >
                <Shield size={14} /> Admin
              </Link>
            )}
            {session ? (
              <button
                onClick={() => signOut()}
                className="py-2 text-sm text-left flex items-center gap-1"
                style={{ color: "var(--error)" }}
              >
                <LogOut size={14} /> Sair
              </button>
            ) : (
              <Link
                href="/login"
                className="btn-primary text-sm"
                style={{ padding: "0.5rem 1rem" }}
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </div>
        )}
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
