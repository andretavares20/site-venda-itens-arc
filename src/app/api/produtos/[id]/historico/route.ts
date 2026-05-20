import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const vendas = await prisma.orderItem.findMany({
    where: {
      stock: { productId: id },
      order: { status: "ENTREGUE" },
    },
    include: {
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
