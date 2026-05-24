import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Chamada pelo Vercel Cron Jobs a cada hora
export async function GET() {
  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // 1. Cancela pedidos PENDENTE com PIX expirado
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

  let cancelled = 0
  if (expired.length > 0) {
    const { count } = await prisma.order.updateMany({
      where: { id: { in: expired.map((o) => o.id) } },
      data: { status: "CANCELADO" },
    })
    cancelled = count
  }

  // 2. Alerta admins sobre pagamentos ao vendedor atrasados (>24h após entrega)
  const overdueOrders = await prisma.order.findMany({
    where: {
      status: "ENTREGUE",
      sellerPaid: false,
      deliveredAt: { lte: twentyFourHoursAgo },
    },
    select: { id: true },
  })

  let alerted = 0
  if (overdueOrders.length > 0) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    })

    for (const order of overdueOrders) {
      for (const admin of admins) {
        // Evita duplicar notificações (uma por pedido por admin)
        const existing = await prisma.notification.findFirst({
          where: {
            userId: admin.id,
            type: "SELLER_PAYMENT_OVERDUE",
            link: `/admin/pedidos`,
            body: { contains: order.id.slice(-8).toUpperCase() },
          },
        })
        if (existing) continue

        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: "SELLER_PAYMENT_OVERDUE",
            title: "Pagamento ao vendedor atrasado",
            body: `Pedido #${order.id.slice(-8).toUpperCase()} está há mais de 24h sem pagamento ao vendedor.`,
            link: `/admin/pedidos`,
          },
        })
        alerted++
      }
    }
  }

  return NextResponse.json({ cancelled, alerted, overdueCount: overdueOrders.length })
}
