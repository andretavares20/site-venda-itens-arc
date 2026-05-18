import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Mercado Pago envia notificações de pagamento
  if (body.type === "payment" && body.data?.id) {
    const paymentId = String(body.data.id)

    const order = await prisma.order.findFirst({ where: { paymentId } })
    if (order && order.status === "PENDENTE") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAGO" },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
