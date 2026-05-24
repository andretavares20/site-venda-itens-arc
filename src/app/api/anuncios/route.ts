import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notify-admins"
import { sendAdminNewListingEmail } from "@/lib/email"
import { ADMIN_EMAIL } from "@/lib/constants"

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

  const itemNames = listing.items.map((i) => i.product.name).join(", ")
  await notifyAdmins(
    "NEW_LISTING",
    `Novo anúncio para retirar`,
    `${session.user.name ?? "Vendedor"} anunciou: ${itemNames}. Combine a retirada no Discord.`,
    "/admin/anuncios",
  )
  sendAdminNewListingEmail({
    adminEmails: [ADMIN_EMAIL],
    sellerName: session.user.name ?? "Usuário",
    sellerEmail: session.user.email ?? "",
    listingId: listing.id,
    items: listing.items.map((it) => ({
      name: it.product.name,
      quantity: it.quantity,
      price: Number(it.price),
    })),
  }).catch(() => {})

  return NextResponse.json(listing)
}
