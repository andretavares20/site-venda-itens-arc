"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ShoppingCart, User, Shield, LogOut, Menu, X, Search } from "lucide-react"
import { useCart, cartCount } from "@/store/cart"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import CartDrawer from "./cart-drawer"

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
    router.push(`/?busca=${encodeURIComponent(query.trim())}`)
  }

  function goCategory(cat: string) {
    closeSearch()
    router.push(`/?categoria=${encodeURIComponent(cat)}#catalogo`)
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
            <Link href="/" className="text-sm transition-colors" style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}>
              Loja
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
