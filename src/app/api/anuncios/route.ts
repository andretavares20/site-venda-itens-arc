import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notify-admins"
import { sendAdminNewListingEmail } from "@/lib/email"
import { sendDiscordDM, sendAdminAlert, dmAnuncioAprovado, embedNovoAnuncio } from "@/lib/discord"
import { requireDiscord } from "@/lib/require-discord"

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

  const discordErr = await requireDiscord(session.user.id)
  if (discordErr) return discordErr

  const { items } = await req.json()

  if (!items?.length) {
    return NextResponse.json({ error: "Adicione pelo menos um item" }, { status: 400 })
  }

  // Cria listing + popula estoque em transação
  const listing = await prisma.$transaction(async (tx) => {
    const created = await tx.listing.create({
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

    for (const item of created.items) {
      await tx.stock.upsert({
        where: { productId_sellerId: { productId: item.productId, sellerId: session.user.id } },
        update: { quantity: { increment: item.quantity }, price: item.price, active: true, listingId: created.id },
        create: { productId: item.productId, sellerId: session.user.id, quantity: item.quantity, price: item.price, listingId: created.id, active: true },
      })
    }

    return created
  })

  const sellerName   = session.user.name ?? "Vendedor"
  const itemNames    = listing.items.map((i) => i.product.name).join(", ")
  const firstItemName = listing.items[0]?.product.name ?? "item"

  // Notificação in-app para admins
  await notifyAdmins(
    "NEW_LISTING",
    `Novo anúncio publicado`,
    `${sellerName} anunciou: ${itemNames}.`,
    `/admin/anuncios?listing=${listing.id}`,
  )

  // Busca discordId do vendedor
  const seller = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { discordId: true },
  })

  // DM ao vendedor — fire-and-forget aceitável
  if (seller?.discordId) {
    sendDiscordDM(seller.discordId, dmAnuncioAprovado(sellerName, firstItemName)).catch(() => {})
  }

  // Alerta no canal admin — await para Vercel não matar antes de completar
  await sendAdminAlert(embedNovoAnuncio({
    sellerName,
    sellerDiscord: seller?.discordId ?? null,
    items: listing.items.map((it) => ({ name: it.product.name, quantity: it.quantity, price: Number(it.price) })),
    listingId: listing.id,
  }))

  // Fire-and-forget: email para admins
  prisma.user
    .findMany({ where: { role: "ADMIN" }, select: { email: true } })
    .then((admins) => {
      const emails = admins.map((a) => a.email).filter(Boolean) as string[]
      return sendAdminNewListingEmail({
        adminEmails: emails,
        sellerName,
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
