import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendPixToSeller } from "@/lib/asaas"

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

      // PIX automático ao vendedor via Asaas
      const seller = fullOrder.items[0]?.listingItem?.listing?.seller
      const sellerAmount = Number(fullOrder.total) - Number(fullOrder.commission)

      if (seller?.pixKey && sellerAmount > 0) {
        try {
          await sendPixToSeller({
            pixKey: seller.pixKey,
            amount: sellerAmount,
            description: `DropBay - Venda #${id.slice(-8).toUpperCase()}`,
            externalReference: id,
          })

          await prisma.order.update({
            where: { id },
            data: { sellerPaid: true },
          })

          return NextResponse.json({ ...order, sellerPaid: true, pixSent: true })
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro desconhecido"
          console.error("PIX Asaas falhou:", msg)
          return NextResponse.json({ ...order, pixSent: false, pixError: msg })
        }
      }
    }
  }

  return NextResponse.json(order)
}
