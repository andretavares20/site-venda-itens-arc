import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  // Valida token do webhook Asaas
  const token = req.headers.get("asaas-access-token")
  const expected = process.env.ASAAS_WEBHOOK_TOKEN
  if (expected && token !== expected) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }

  const body = await req.json()

  if (
    (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") &&
    body.payment?.externalReference
  ) {
    const orderId = body.payment.externalReference
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (order?.status === "PENDENTE") {
      await prisma.order.update({ where: { id: orderId }, data: { status: "PAGO" } })
    }
  }

  return NextResponse.json({ ok: true })
}
