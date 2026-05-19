import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { mpPayment } from "@/lib/mercadopago"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      items: true,
      seller: { select: { name: true, email: true } },
    },
  })

  if (!listing) return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 })
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  // Cancelamento gratuito se ainda não entregou
  if (listing.status === "PENDENTE_ENTREGA") {
    await prisma.listing.update({ where: { id }, data: { status: "CANCELADO" } })
    return NextResponse.json({ free: true })
  }

  if (listing.status !== "DISPONIVEL") {
    return NextResponse.json({ error: "Este anúncio não pode ser cancelado" }, { status: 400 })
  }

  // Calcula a taxa de cancelamento (10% do total anunciado)
  const total = listing.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const fee = Math.round(total * 0.10 * 100) / 100

  // Gera PIX para a taxa
  const [firstName, ...rest] = (listing.seller.name ?? "Vendedor").split(" ")
  const payment = await mpPayment.create({
    body: {
      transaction_amount: fee,
      description: `Taxa de cancelamento - Anúncio #${id.slice(-8).toUpperCase()}`,
      payment_method_id: "pix",
      payer: {
        email: listing.seller.email,
        first_name: firstName,
        last_name: rest.join(" ") || firstName,
      },
    },
  })

  const txData = payment.point_of_interaction?.transaction_data

  await prisma.listing.update({
    where: { id },
    data: {
      status: "CANCELAMENTO_SOLICITADO",
      adminNotes: JSON.stringify({
        cancelPaymentId: String(payment.id),
        fee,
        pixCode: txData?.qr_code,
        pixQrCode: txData?.qr_code_base64,
      }),
    },
  })

  return NextResponse.json({
    free: false,
    fee,
    pixCode: txData?.qr_code ?? "",
    pixQrCode: txData?.qr_code_base64 ?? "",
  })
}
