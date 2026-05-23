import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Chamada pelo Vercel Cron Jobs a cada hora
// Cancela pedidos PENDENTE cujo PIX já expirou
export async function GET() {
  const now = new Date()

  // Fallback: se pixExpires for nulo, cancela após 2h sem pagamento
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  const expired = await prisma.order.findMany({
    where: {
      status: "PENDENTE",
      OR: [
        { pixExpires: { lte: now } },
        { pixExpires: null, createdAt: { lte: twoHoursAgo } },
      ],
    },
    select: { id: true },
  })

  if (expired.length === 0) {
    return NextResponse.json({ cancelled: 0 })
  }

  const { count } = await prisma.order.updateMany({
    where: { id: { in: expired.map((o) => o.id) } },
    data: { status: "CANCELADO" },
  })

  return NextResponse.json({ cancelled: count })
}
