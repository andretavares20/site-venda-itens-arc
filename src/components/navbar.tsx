"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ShoppingCart, User, Shield, LogOut, Menu, X, Search } from "lucide-react"
import { useCart, cartCount } from "@/store/cart"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import CartDrawer from "./cart-drawer"
import NotificationBell from "./notification-bell"
import { DISCORD_URL } from "@/lib/constants"

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const items = useCart((s) => s.items)
  const count = cartCount(items)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 50)
      if (categories.length === 0) {
        fetch("/api/categorias").then(r => r.json()).then(setCategories)
      }
    }
  }, [searchOpen, categories.length])

  const closeSearch = useCallback(() => { setSearchOpen(false); setQuery("") }, [])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") closeSearch() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [closeSearch])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    closeSearch()
    router.push(`/loja?busca=${encodeURIComponent(query.trim())}`)
  }

  function goCategory(cat: string) {
    closeSearch()
    router.push(`/loja?categoria=${encodeURIComponent(cat)}`)
  }

  return (
    <>
      {/* Overlay de busca */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60]" onClick={closeSearch}>
          <div className="relative" onClick={e => e.stopPropagation()}
            style={{ background: "rgba(22,22,23,0.97)", backdropFilter: "saturate(180%) blur(30px)" }}>

            {/* Input */}
            <div className="max-w-3xl mx-auto px-6 flex items-center gap-3"
              style={{ height: "56px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Search size={16} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              <form onSubmit={handleSearch} className="flex-1">
                <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar itens de Arc Raiders..."
                  className="w-full bg-transparent outline-none"
                  style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px" }} />
              </form>
              <button onClick={closeSearch}
                style={{ color: "var(--accent)", fontSize: "14px", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                Cancelar
              </button>
            </div>

            {/* Categorias */}
            {categories.length > 0 && (
              <div className="max-w-3xl mx-auto px-6 py-5">
                <p className="text-xs font-semibold mb-3"
                  style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
                  CATEGORIAS
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => goCategory(cat)}
                      className="flex items-center gap-2 py-2.5 text-left transition-colors"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.5, flexShrink: 0 }}>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      <span style={{ fontSize: "14px" }}>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ background: "rgba(0,0,0,0.4)" }} className="h-full" />
        </div>
      )}

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
          <Link href="/" className="text-lg font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Drop<span style={{ color: "var(--accent)" }}>Bay</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/anunciar" className="text-sm transition-colors" style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
              Anunciar
            </Link>
            <Link href="/trocas" className="text-sm transition-colors" style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
              Trocas
            </Link>
            <Link href="/encomendas" className="text-sm transition-colors" style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
              Encomendas
            </Link>
            <Link href="/loja" className="text-sm transition-colors" style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
              Loja
            </Link>
            <Link href="/parceiros"
              className="inline-flex items-center justify-center rounded-full font-medium text-sm"
              style={{ background: "#f5f5f7", color: "#000", padding: "0.375rem 1rem" }}>
              Quero ser parceiro
            </Link>
            {session?.user.role === "ADMIN" && (
              <Link href="/admin" className="text-sm flex items-center gap-1 transition-colors" style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
                <Shield size={14} /> Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {/* Lupa */}
            <button onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-primary)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}>
              <Search size={18} />
            </button>

            {/* Discord */}
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "#5865F2" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}
              aria-label="Discord">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.027.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>

            {/* Notificações (só para usuários logados) */}
            {session && <NotificationBell />}

            {/* Carrinho */}
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-primary)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}
              aria-label="Carrinho">
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full"
                  style={{ background: "var(--accent)" }}>
                  {count}
                </span>
              )}
            </button>

            {session ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/minha-conta"
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-primary)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}>
                  <User size={14} />
                  {session.user.name?.split(" ")[0]}
                </Link>
                <button onClick={() => signOut()}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-primary)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)" }}
                  title="Sair">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:flex btn-primary text-sm" style={{ padding: "0.375rem 1rem" }}>
                Entrar
              </Link>
            )}

            <button className="md:hidden flex items-center justify-center w-9 h-9 rounded-full"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
            <Link href="/" className="py-2 text-sm" style={{ color: "var(--text-secondary)" }} onClick={() => setMenuOpen(false)}>Loja</Link>
            <Link href="/anunciar" className="py-2 text-sm" style={{ color: "var(--text-secondary)" }} onClick={() => setMenuOpen(false)}>Anunciar</Link>
            <Link href="/trocas" className="py-2 text-sm" style={{ color: "var(--text-secondary)" }} onClick={() => setMenuOpen(false)}>Trocas</Link>
            <Link href="/encomendas" className="py-2 text-sm" style={{ color: "var(--text-secondary)" }} onClick={() => setMenuOpen(false)}>Encomendas</Link>
            <Link href="/parceiros" className="py-2 text-sm font-medium" style={{ color: "var(--accent)" }} onClick={() => setMenuOpen(false)}>Quero ser parceiro</Link>
            <button onClick={() => { setMenuOpen(false); setSearchOpen(true) }}
              className="py-2 text-sm text-left flex items-center gap-2"
              style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
              <Search size={14} /> Buscar
            </button>
            {session?.user.role === "ADMIN" && (
              <Link href="/admin" className="py-2 text-sm flex items-center gap-1" style={{ color: "var(--text-secondary)" }} onClick={() => setMenuOpen(false)}>
                <Shield size={14} /> Admin
              </Link>
            )}
            {session ? (
              <button onClick={() => signOut()} className="py-2 text-sm text-left flex items-center gap-1" style={{ color: "var(--error)", background: "none", border: "none", cursor: "pointer" }}>
                <LogOut size={14} /> Sair
              </button>
            ) : (
              <Link href="/login" className="btn-primary text-sm" style={{ padding: "0.5rem 1rem" }} onClick={() => setMenuOpen(false)}>Entrar</Link>
            )}
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
