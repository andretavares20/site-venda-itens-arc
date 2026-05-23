import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { mpPayment } from "@/lib/mercadopago"

const COMMISSION_RATE = 0.10

type CartItem = { stockId: string; quantity: number; price: number }

function round2(n: number) { return Math.round(n * 100) / 100 }

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const where = session.user.role === "ADMIN" ? {} : { buyerId: session.user.id }

  const isAdmin = session.user.role === "ADMIN"

  const orders = await prisma.order.findMany({
    where,
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          stock: {
            include: {
              product: { select: { name: true, image: true } },
              seller: { select: { id: true, name: true, pixKey: isAdmin } },
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

  const { items, total, couponCode }: { items: CartItem[]; total: number; couponCode?: string } = await req.json()
  if (!items?.length) return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 })

  // Valida e aplica cupom
  let couponDiscount = 0
  let riderCommission = 0
  let validatedCouponCode: string | null = null

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
      select: { id: true, code: true, discountPercent: true, commissionPercent: true, active: true },
    })
    if (coupon && coupon.active) {
      validatedCouponCode = coupon.code
      couponDiscount = total * (coupon.discountPercent / 100)
      riderCommission = total * (coupon.commissionPercent / 100)
    }
  }

  const finalTotal = round2(total - couponDiscount) // MP exige 2 casas decimais
  const commission = round2(finalTotal * COMMISSION_RATE)

  // Valida que todos os itens do estoque têm quantidade suficiente
  for (const item of items) {
    const stock = await prisma.stock.findUnique({ where: { id: item.stockId } })
    if (!stock || !stock.active || stock.quantity < item.quantity) {
      return NextResponse.json({ error: "Item sem estoque suficiente" }, { status: 400 })
    }
  }

  const order = await prisma.order.create({
    data: {
      buyerId: session.user.id,
      total: finalTotal,
      commission,
      couponCode: validatedCouponCode,
      couponDiscount: couponDiscount > 0 ? couponDiscount : null,
      riderCommission: riderCommission > 0 ? riderCommission : null,
      items: {
        create: items.map((i) => ({
          stockId: i.stockId,
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
        transaction_amount: finalTotal,
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
      total: finalTotal,
    })
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELADO" } })
    console.error("Erro Mercado Pago:", err)
    return NextResponse.json({ error: "Erro ao gerar PIX. Tente novamente." }, { status: 500 })
  }
}
