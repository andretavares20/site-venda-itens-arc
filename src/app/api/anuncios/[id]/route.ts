import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendDiscordDM, dmAnuncioAprovado } from "@/lib/discord"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, pixKey: true } },
      items: { include: { product: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, adminNotes } = body

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!listing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isAdmin = session.user.role === "ADMIN"
  const isOwner = listing.sellerId === session.user.id

  if (!isAdmin) {
    if (!isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (status !== "CANCELADO") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { status, ...(adminNotes !== undefined && { adminNotes }) },
    include: { items: { include: { product: true } } },
  })

  // DM para o vendedor quando aprovado
  if (status === "DISPONIVEL" && isAdmin) {
    prisma.user.findUnique({ where: { id: listing.sellerId }, select: { discordId: true, name: true } })
      .then((seller) => {
        if (seller?.discordId) {
          const itemName = listing.items[0] ? `item do anúncio #${id.slice(-8).toUpperCase()}` : "seu item"
          sendDiscordDM(seller.discordId, dmAnuncioAprovado(seller.name ?? "Vendedor", itemName)).catch(() => {})
        }
      }).catch(() => {})
  }

  // Quando admin aprova (DISPONIVEL) → popula estoque
  if (status === "DISPONIVEL" && isAdmin) {
    for (const item of listing.items) {
      await prisma.stock.upsert({
        where: {
          productId_sellerId: {
            productId: item.productId,
            sellerId: listing.sellerId,
          },
        },
        update: {
          quantity: { increment: item.quantity },
          price: item.price,
          active: true,
          listingId: id,
        },
        create: {
          productId: item.productId,
          sellerId: listing.sellerId,
          quantity: item.quantity,
          price: item.price,
          listingId: id,
          active: true,
        },
      })
    }
  }

  // Quando anúncio é cancelado → remove do estoque
  if ((status === "CANCELADO" || status === "CANCELAMENTO_SOLICITADO") && isAdmin) {
    for (const item of listing.items) {
      await prisma.stock.updateMany({
        where: { productId: item.productId, sellerId: listing.sellerId },
        data: { quantity: { decrement: item.quantity } },
      })
    }
  }

  return NextResponse.json(updated)
}
