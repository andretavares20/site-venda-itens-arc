import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const encomendas = await prisma.encomenda.findMany({
    include: {
      buyer: { select: { id: true, name: true, discordId: true } },
      product: { select: { id: true, name: true, category: true, rarity: true } },
      proposals: {
        include: {
          seller: { select: { id: true, name: true, discordId: true } },
          order: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(encomendas)
}
