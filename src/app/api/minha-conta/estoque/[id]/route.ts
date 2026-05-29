import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  const stock = await prisma.stock.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: { order: { select: { status: true } } },
      },
    },
  })

  if (!stock) return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
  if (stock.sellerId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const hasPaidOrder = stock.orderItems.some(
    (oi) => oi.order.status === "PAGO" || oi.order.status === "ENTREGUE"
  )

  if (hasPaidOrder) {
    return NextResponse.json(
      { error: "Este item possui um pedido pago em andamento e não pode ser removido." },
      { status: 409 }
    )
  }

  await prisma.stock.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
