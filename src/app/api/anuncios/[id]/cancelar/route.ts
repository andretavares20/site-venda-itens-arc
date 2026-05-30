import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notify-admins"
import { createPrivateChannel, embedCancelamentoPendente } from "@/lib/discord"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { name: true, discordId: true } },
      items: { include: { product: true } },
    },
  })

  if (!listing) return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 })
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  if (!["DISPONIVEL", "PARCIALMENTE_VENDIDO", "PENDENTE_ENTREGA"].includes(listing.status)) {
    return NextResponse.json({ error: "Este anúncio não pode ser cancelado" }, { status: 400 })
  }

  // Verifica se há pedido pago com itens desta listing
  const paidOrderItem = await prisma.orderItem.findFirst({
    where: {
      stock: { listingId: id },
      order: { status: { in: ["PAGO", "COM_RECLAMACAO"] } },
    },
    include: {
      order: {
        include: { buyer: { select: { name: true, discordId: true } } },
      },
    },
  })

  if (paidOrderItem) {
    await prisma.listing.update({ where: { id }, data: { status: "CANCELAMENTO_SOLICITADO" } })
    for (const item of listing.items) {
      await prisma.stock.updateMany({
        where: { productId: item.productId, sellerId: listing.sellerId },
        data: { quantity: { decrement: item.quantity } },
      })
    }

    const buyer  = paidOrderItem.order.buyer
    const seller = listing.seller
    const items  = listing.items.map((i) => ({ name: i.product.name, quantity: i.quantity }))

    // Abre canal privado no Discord com vendedor e admin
    const memberIds = [seller.discordId].filter(Boolean) as string[]
    createPrivateChannel({
      name: `cancelamento-${id.slice(-8).toLowerCase()}`,
      topic: `Cancelamento anúncio #${id.slice(-8).toUpperCase()} · ${seller.name} / ${buyer.name}`,
      memberDiscordIds: memberIds,
      introEmbed: embedCancelamentoPendente({
        listingId: id,
        sellerName:    seller.name ?? "Vendedor",
        sellerDiscord: seller.discordId ?? null,
        buyerName:     buyer.name ?? "Comprador",
        items,
      }),
    }).catch(() => {})

    notifyAdmins(
      "CANCEL_REQUEST",
      "Cancelamento pendente — pedido pago",
      `${session.user.name ?? "Vendedor"} solicitou cancelamento com pedido pago: ${items.map((i) => i.name).join(", ")}.`,
      `/admin/anuncios`,
    ).catch(() => {})

    return NextResponse.json({ type: "pendente" })
  }

  // Cancelamento imediato
  await prisma.listing.update({ where: { id }, data: { status: "CANCELADO" } })
  for (const item of listing.items) {
    await prisma.stock.updateMany({
      where: { productId: item.productId, sellerId: listing.sellerId },
      data: { quantity: { decrement: item.quantity } },
    })
  }

  return NextResponse.json({ type: "imediato" })
}
