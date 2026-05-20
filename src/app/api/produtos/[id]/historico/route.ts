import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Busca as últimas 30 vendas concluídas deste produto
  const vendas = await prisma.orderItem.findMany({
    where: {
      listingItem: {
        productId: id,
        status: "VENDIDO",
      },
      order: { status: "ENTREGUE" },
    },
    select: {
      price: true,
      order: { select: { createdAt: true } },
    },
    orderBy: { order: { createdAt: "asc" } },
    take: 30,
  })

  return NextResponse.json(
    vendas.map((v) => ({
      price: Number(v.price),
      date: v.order.createdAt,
    }))
  )
}
