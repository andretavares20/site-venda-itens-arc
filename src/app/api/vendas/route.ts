import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: {
      status: { not: "PENDENTE" },
      items: { some: { stock: { sellerId: session.user.id } } },
    },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          stock: {
            include: {
              product: { select: { name: true, image: true } },
              seller: { select: { id: true } },
            },
          },
        },
      },
      complaints: { where: { userId: session.user.id }, select: { id: true, status: true } },
      reviews: { where: { giverId: session.user.id, type: "VENDEDOR_PARA_COMPRADOR" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Filtra apenas itens que pertencem a este vendedor
  const filtered = orders.map((o) => ({
    ...o,
    items: o.items.filter((i) => i.stock?.seller?.id === session.user.id),
  }))

  return NextResponse.json(filtered)
}
