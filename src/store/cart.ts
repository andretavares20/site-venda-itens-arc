"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  slug: string
  quantity: number
  stock: number
}

type CartStore = {
  items: CartItem[]
  add: (item: Omit<CartItem, "quantity">) => void
  remove: (id: string) => void
  update: (id: string, quantity: number) => void
  clear: () => void
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const existing = get().items.find((i) => i.id === item.id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] })
        }
      },
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      update: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) })
          return
        }
        set({
          items: get().items.map((i) => {
            if (i.id !== id) return i
            const capped = Math.min(quantity, i.stock)
            return { ...i, quantity: capped }
          }),
        })
      },
      clear: () => set({ items: [] }),
    }),
    { name: "arc-cart" }
  )
)

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}
