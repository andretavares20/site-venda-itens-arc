import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          listingItem: {
            include: {
              product: true,
              listing: { include: { seller: { select: { id: true, name: true, pixKey: true } } } },
            },
          },
        },
      },
    },
  })

  if (!order) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  if (order.buyerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  return NextResponse.json(order)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params
  const { status, sellerPaid } = await req.json()

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(sellerPaid !== undefined && { sellerPaid }),
    },
  })

  // Quando ENTREGUE: marca ListingItems como vendidos + tenta PIX automático ao vendedor
  if (status === "ENTREGUE") {
    const fullOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            listingItem: {
              include: {
                listing: { include: { seller: { select: { name: true, pixKey: true } } } },
              },
            },
          },
        },
      },
    })

    if (fullOrder) {
      // Marca ListingItems como vendidos
      for (const item of fullOrder.items) {
        await prisma.listingItem.update({
          where: { id: item.listingItemId },
          data: { status: "VENDIDO" },
        })
      }

      // Tenta PIX automático ao vendedor
      const seller = fullOrder.items[0]?.listingItem?.listing?.seller
      const pixKey = seller?.pixKey
      const sellerAmount = Number(fullOrder.total) - Number(fullOrder.commission)

      if (pixKey && sellerAmount > 0) {
        try {
          const transferRes = await fetch("https://api.mercadopago.com/v1/account/bank_transfers", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": `seller-pay-${id}`,
            },
            body: JSON.stringify({
              amount: sellerAmount,
              currency_id: "BRL",
              receiver: {
                type: "payment_method",
                id: "pix",
                key_value: pixKey,
              },
              description: `DropBay - Venda #${id.slice(-8).toUpperCase()}`,
            }),
          })

          const transferData = await transferRes.json()

          if (transferRes.ok) {
            // Transferência bem-sucedida — marca vendedor como pago automaticamente
            await prisma.order.update({
              where: { id },
              data: { sellerPaid: true },
            })
            return NextResponse.json({ ...order, sellerPaid: true, pixSent: true })
          } else {
            // Log do erro mas não bloqueia — admin pode pagar manualmente
            console.error("PIX automático falhou:", transferData)
            return NextResponse.json({ ...order, pixSent: false, pixError: transferData })
          }
        } catch (err) {
          console.error("Erro ao enviar PIX ao vendedor:", err)
        }
      }
    }
  }

  return NextResponse.json(order)
}
