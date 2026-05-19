import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.type === "payment" && body.data?.id) {
    const paymentId = String(body.data.id)

    // Verifica se é pagamento de pedido
    const order = await prisma.order.findFirst({ where: { paymentId } })
    if (order?.status === "PENDENTE") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAGO" } })
      return NextResponse.json({ ok: true })
    }

    // Verifica se é taxa de cancelamento de anúncio
    const listings = await prisma.listing.findMany({
      where: { status: "CANCELAMENTO_SOLICITADO" as never },
    })

    for (const listing of listings) {
      try {
        const notes = JSON.parse(listing.adminNotes ?? "{}")
        if (notes.cancelPaymentId === paymentId) {
          await prisma.listing.update({
            where: { id: listing.id },
            data: { status: "CANCELADO", adminNotes: JSON.stringify({ ...notes, feePaid: true }) },
          })
          break
        }
      } catch {}
    }
  }

  return NextResponse.json({ ok: true })
}
