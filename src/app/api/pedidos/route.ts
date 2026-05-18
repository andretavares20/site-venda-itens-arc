import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { mpPayment } from "@/lib/mercadopago"

type OrderItem = { productId: string; quantity: number; price: number }

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id }
  const orders = await prisma.order.findMany({
    where,
    include: { items: { include: { product: { select: { name: true } } } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 })

  const { items, total }: { items: OrderItem[]; total: number } = await req.json()

  if (!items?.length) return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 })

  // Cria pedido no banco
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      total,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
  })

  try {
    const [firstName, ...rest] = (session.user.name ?? "Cliente").split(" ")
    const payment = await mpPayment.create({
      body: {
        transaction_amount: total,
        description: `Pedido ArcStore #${order.id.slice(-8).toUpperCase()}`,
        payment_method_id: "pix",
        payer: {
          email: session.user.email,
          first_name: firstName,
          last_name: rest.join(" ") || firstName,
        },
      },
    })

    const txData = payment.point_of_interaction?.transaction_data
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: String(payment.id),
        pixCode: txData?.qr_code ?? null,
        pixQrCode: txData?.qr_code_base64 ?? null,
        pixExpires: payment.date_of_expiration ? new Date(payment.date_of_expiration) : null,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      pixCode: txData?.qr_code ?? "",
      pixQrCode: txData?.qr_code_base64 ?? "",
      total,
    })
  } catch (err) {
    // Cancela o pedido se o PIX falhar
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELADO" } })
    console.error("Erro Mercado Pago:", err)
    return NextResponse.json({ error: "Erro ao gerar PIX. Tente novamente." }, { status: 500 })
  }
}
