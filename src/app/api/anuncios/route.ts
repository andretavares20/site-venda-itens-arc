import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notify-admins"
import { sendAdminNewListingEmail } from "@/lib/email"
import { ADMIN_EMAIL } from "@/lib/constants"
import { sendDiscordDM, sendAdminAlert, dmAnuncioAprovado, embedNovoAnuncio } from "@/lib/discord"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mine = searchParams.get("mine")

  const where = session.user.role === "ADMIN" && !mine
    ? {}
    : { sellerId: session.user.id }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      seller: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(listings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Faça login para anunciar" }, { status: 401 })

  const { items } = await req.json()

  if (!items?.length) {
    return NextResponse.json({ error: "Adicione pelo menos um item" }, { status: 400 })
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: session.user.id,
      status: "DISPONIVEL",
      items: {
        create: items.map((i: { productId: string; quantity: number; price: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  })

  // Popula estoque imediatamente
  for (const item of listing.items) {
    await prisma.stock.upsert({
      where: { productId_sellerId: { productId: item.productId, sellerId: session.user.id } },
      update: { quantity: { increment: item.quantity }, price: item.price, active: true, listingId: listing.id },
      create: { productId: item.productId, sellerId: session.user.id, quantity: item.quantity, price: item.price, listingId: listing.id, active: true },
    })
  }

  const itemNames = listing.items.map((i) => i.product.name).join(", ")
  const firstItemName = listing.items[0]?.product.name ?? "item"

  // Notificação in-app para admins
  await notifyAdmins(
    "NEW_LISTING",
    `Novo anúncio publicado`,
    `${session.user.name ?? "Vendedor"} anunciou: ${itemNames}.`,
    `/admin/anuncios?listing=${listing.id}`,
  )

  // Fire-and-forget: Discord (DM vendedor + alerta canal admin)
  prisma.user
    .findUnique({ where: { id: session.user.id }, select: { discordId: true } })
    .then((seller) => {
      if (seller?.discordId) {
        sendDiscordDM(seller.discordId, dmAnuncioAprovado(session.user.name ?? "Vendedor", firstItemName)).catch(() => {})
      }
      sendAdminAlert(embedNovoAnuncio({
        sellerName: session.user.name ?? "Vendedor",
        sellerDiscord: seller?.discordId ?? null,
        items: listing.items.map((it) => ({ name: it.product.name, quantity: it.quantity, price: Number(it.price) })),
        listingId: listing.id,
      })).catch(() => {})
    })
    .catch(() => {})

  // Fire-and-forget: email para admins
  prisma.user
    .findMany({ where: { role: "ADMIN" }, select: { email: true } })
    .then((admins) => {
      const emails = admins.map((a) => a.email).filter(Boolean) as string[]
      return sendAdminNewListingEmail({
        adminEmails: emails,
        sellerName: session.user.name ?? "Usuário",
        sellerEmail: session.user.email ?? "",
        listingId: listing.id,
        items: listing.items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          price: Number(it.price),
        })),
      })
    })
    .catch(() => {})

  return NextResponse.json(listing)
}
