import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { findOrCreateCustomer, createPixCharge } from "@/lib/asaas"

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

  const commission = Math.round(total * COMMISSION_RATE * 100) / 100

  // Busca dados do comprador incluindo CPF
  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, cpf: true, asaasId: true },
  })

  if (!buyer?.cpf) {
    return NextResponse.json({ error: "CPF não cadastrado. Atualize seu perfil." }, { status: 400 })
  }

  // Cria pedido no banco
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
    // Cria ou recupera cliente no Asaas
    const asaasCustomerId = await findOrCreateCustomer({
      name: buyer.name,
      email: buyer.email,
      cpf: buyer.cpf,
    })

    // Salva asaasId no usuário se ainda não tinha
    if (!buyer.asaasId) {
      await prisma.user.update({
        where: { id: buyer.id },
        data: { asaasId: asaasCustomerId },
      })
    }

    // Gera cobrança PIX no Asaas
    const pix = await createPixCharge({
      customerId: asaasCustomerId,
      amount: total,
      description: `DropBay #${order.id.slice(-8).toUpperCase()}`,
      externalReference: order.id,
    })

    // Salva dados do PIX no pedido
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: pix.paymentId,
        pixCode: pix.pixCode,
        pixQrCode: pix.pixQrCode,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      pixCode: pix.pixCode,
      pixQrCode: pix.pixQrCode,
      total,
    })
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELADO" } })
    console.error("Erro Asaas:", err)
    return NextResponse.json({ error: "Erro ao gerar PIX. Tente novamente." }, { status: 500 })
  }
}
