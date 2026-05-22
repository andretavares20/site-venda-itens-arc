import { prisma } from "@/lib/db"

type OrderItem = { stockId: string | null; quantity: number }

export async function decrementStockForOrder(items: OrderItem[]) {
  for (const item of items) {
    if (!item.stockId) continue
    await prisma.stock.update({
      where: { id: item.stockId },
      data: { quantity: { decrement: item.quantity } },
    })
    const updated = await prisma.stock.findUnique({ where: { id: item.stockId } })
    if (updated && updated.quantity <= 0) {
      await prisma.stock.update({ where: { id: item.stockId }, data: { quantity: 0, active: false } })
    }
  }
}
