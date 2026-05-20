import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { mpPayment } from "@/lib/mercadopago"

const COMMISSION_RATE = 0.10

type CartItem = { listingItemId: string; quantity: number; price: number }

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const where = session.user.role === "ADMIN" ? {} : { buyerId: session.user.id }

  const orders = await prisma.order.findMany({
    where,
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          listingItem: {
            include: {
              product: { select: { name: true, image: true } },
              listing: { include: { seller: { select: { id: true, name: true, pixKey: true } } } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 })

  const { items, total }: { items: CartItem[]; total: number } = await req.json()

  if (!items?.length) return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 })
  if (total < 5) return NextResponse.json({ error: "O valor mínimo por pedido é R$ 5,00." }, { status: 400 })

  const commission = Math.round(total * COMMISSION_RATE * 100) / 100

  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id,
      total,
      commission,
      items: {
        create: items.map((i) => ({
          listingItemId: i.listingItemId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
  })

  try {
    const buyer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    })

    const [firstName, ...rest] = (buyer?.name ?? "Cliente").split(" ")
    const payment = await mpPayment.create({
      body: {
        transaction_amount: total,
        description: `DropBay #${order.id.slice(-8).toUpperCase()}`,
        payment_method_id: "pix",
        payer: {
          email: buyer?.email ?? session.user.email,
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
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELADO" } })
    console.error("Erro Mercado Pago:", err)
    return NextResponse.json({ error: "Erro ao gerar PIX. Tente novamente." }, { status: 500 })
  }
}
