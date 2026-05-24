import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const isAdmin = session.user.role === "ADMIN"

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          stock: {
            include: {
              product: true,
              seller: { select: { id: true, name: true, pixKey: isAdmin } },
            },
          },
        },
      },
    },
  })

  if (!order) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  if (order.buyerId !== session.user.id && session.user.role !== "ADMIN") {
    // Vendedor também pode ver o pedido
    const isSeller = order.items.some((i) => i.stock?.seller?.id === session.user.id)
    if (!isSeller) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  return NextResponse.json(order)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const isAdmin = session.user.role === "ADMIN"

  // ── Ações admin legadas (sellerPaid, riderPaid, status direto) ──
  if (isAdmin && (body.sellerPaid !== undefined || body.riderPaid !== undefined || (body.status && !body.action))) {
    const { status, sellerPaid, riderPaid } = body

    const before = status === "ENTREGUE"
      ? await prisma.order.findUnique({ where: { id }, select: { buyerId: true, status: true } })
      : null

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(status === "ENTREGUE" && { deliveredAt: new Date() }),
        ...(sellerPaid !== undefined && { sellerPaid }),
        ...(riderPaid !== undefined && { riderPaid }),
      },
    })

    if (before && before.status !== "ENTREGUE" && status === "ENTREGUE") {
      await prisma.notification.create({
        data: {
          userId: before.buyerId,
          type: "ORDER_DELIVERED",
          title: "Pedido entregue!",
          body: `Seu pedido #${id.slice(-8).toUpperCase()} foi marcado como entregue. Avalie o vendedor!`,
          link: `/pedido/${id}`,
        },
      })
    }

    return NextResponse.json(order)
  }

  // ── Ações baseadas em action ──
  const { action } = body

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          stock: { include: { seller: { select: { id: true, name: true } } } },
        },
      },
    },
  })

  if (!order) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isBuyer = order.buyerId === session.user.id
  const sellerId = order.items[0]?.stock?.seller?.id
  const isSeller = sellerId === session.user.id
  const orderId = id.slice(-8).toUpperCase()

  // ── Vendedor marca como entregue ──
  if (action === "entregar") {
    if (!isSeller && !isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (order.status !== "PAGO") return NextResponse.json({ error: "Pedido não está em andamento" }, { status: 400 })
    if (order.sellerDelivered) return NextResponse.json({ error: "Já marcado como entregue" }, { status: 400 })

    await prisma.order.update({ where: { id }, data: { sellerDelivered: true } })

    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: "ORDER_SELLER_DELIVERED",
        title: "Vendedor marcou como entregue",
        body: `O vendedor informou que entregou o item do pedido #${orderId}. Confirme o recebimento quando receber.`,
        link: `/pedido/${id}`,
      },
    })

    return NextResponse.json({ ok: true })
  }

  // ── Comprador confirma recebimento ──
  if (action === "receber") {
    if (!isBuyer) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (order.status !== "PAGO") return NextResponse.json({ error: "Pedido não está em andamento" }, { status: 400 })
    if (order.buyerReceived) return NextResponse.json({ error: "Já confirmado" }, { status: 400 })

    await prisma.order.update({
      where: { id },
      data: { buyerReceived: true, status: "ENTREGUE", deliveredAt: new Date() },
    })

    if (sellerId) {
      await prisma.notification.create({
        data: {
          userId: sellerId,
          type: "ORDER_DELIVERED",
          title: "Entrega confirmada!",
          body: `O comprador confirmou o recebimento do pedido #${orderId}. Aguarde o pagamento.`,
          link: `/minha-conta/vendas`,
        },
      })
    }

    return NextResponse.json({ ok: true })
  }

  // ── Admin confirma tudo OK (fallback quando nenhum dos dois age) ──
  if (action === "admin_ok") {
    if (!isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (order.status !== "PAGO") return NextResponse.json({ error: "Pedido não está em andamento" }, { status: 400 })

    await prisma.order.update({
      where: { id },
      data: { adminConfirmed: true, status: "ENTREGUE", deliveredAt: new Date() },
    })

    const notifs = [
      {
        userId: order.buyerId,
        type: "ORDER_DELIVERED",
        title: "Pedido concluído pelo admin",
        body: `O pedido #${orderId} foi marcado como entregue pela administração.`,
        link: `/pedido/${id}`,
      },
    ]
    if (sellerId) {
      notifs.push({
        userId: sellerId,
        type: "ORDER_DELIVERED",
        title: "Pedido concluído pelo admin",
        body: `O pedido #${orderId} foi marcado como entregue pela administração. Aguarde o pagamento.`,
        link: `/minha-conta/vendas`,
      })
    }
    await prisma.notification.createMany({ data: notifs })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
