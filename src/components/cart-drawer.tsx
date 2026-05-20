"use client"

import { useCart, cartTotal } from "@/store/cart"
import { X, Trash2, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect } from "react"

type Props = { open: boolean; onClose: () => void }

export default function CartDrawer({ open, onClose }: Props) {
  const { items, remove, update } = useCart()
  const total = cartTotal(items)

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        />
      )}
      <aside
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          background: "var(--surface-1)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 h-14"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Carrinho
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
            <ShoppingBag size={48} style={{ color: "var(--text-tertiary)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Seu carrinho está vazio
            </p>
            <button onClick={onClose} className="btn-primary text-sm" style={{ padding: "0.5rem 1.25rem" }}>
              Explorar loja
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3"
                  style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}
                >
                  <div
                    className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--accent)" }}>
                      R$ {item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="flex items-center rounded-lg overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}
                      >
                        <button
                          onClick={() => update(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-sm transition-colors"
                          style={{ color: "var(--text-secondary)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--surface-2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          −
                        </button>
                        <span
                          className="w-8 text-center text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => update(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-7 h-7 flex items-center justify-center text-sm transition-colors"
                          style={{
                            color: item.quantity >= item.stock ? "var(--text-tertiary)" : "var(--text-secondary)",
                            cursor: item.quantity >= item.stock ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={(e) => {
                            if (item.quantity < item.stock)
                              e.currentTarget.style.background = "var(--surface-2)"
                          }}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item.id)}
                        className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--error)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-tertiary)")
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div
              className="px-6 py-5 flex flex-col gap-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Total
                </span>
                <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  R$ {total.toFixed(2)}
                </span>
              </div>

              <Link href="/checkout" onClick={onClose} className="btn-primary w-full">
                Finalizar compra
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
