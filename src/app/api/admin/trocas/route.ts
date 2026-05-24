import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const trades = await prisma.trade.findMany({
    include: {
      user: { select: { id: true, name: true, discordId: true } },
      offerItems: { include: { product: { select: { name: true } } } },
      proposals: {
        where: { status: { in: ["ACEITA", "CONCLUIDA", "COM_RECLAMACAO"] } },
        include: {
          proposer: { select: { id: true, name: true, discordId: true } },
          offerItems: { include: { product: { select: { name: true } } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(trades)
}
