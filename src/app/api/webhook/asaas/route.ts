import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Asaas envia event PAYMENT_RECEIVED quando PIX é pago
  if (body.event === "PAYMENT_RECEIVED" && body.payment?.externalReference) {
    const orderId = body.payment.externalReference

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order?.status === "PENDENTE") {
      await prisma.order.update({ where: { id: orderId }, data: { status: "PAGO" } })
    }
  }

  // Também trata PAYMENT_CONFIRMED como alternativa
  if (body.event === "PAYMENT_CONFIRMED" && body.payment?.externalReference) {
    const orderId = body.payment.externalReference

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order?.status === "PENDENTE") {
      await prisma.order.update({ where: { id: orderId }, data: { status: "PAGO" } })
    }
  }

  return NextResponse.json({ ok: true })
}
