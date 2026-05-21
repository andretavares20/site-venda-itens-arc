import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const items = await prisma.stock.findMany({
    where: { sellerId: session.user.id },
    include: {
      product: {
        select: { name: true, image: true, rarity: true, category: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Busca status dos listings separadamente
  const listingIds = items.map(i => i.listingId).filter(Boolean) as string[]
  const listings = listingIds.length > 0
    ? await prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: { id: true, status: true },
      })
    : []

  const listingMap = Object.fromEntries(listings.map(l => [l.id, l]))

  return NextResponse.json(items.map(i => ({
    ...i,
    price: Number(i.price),
    listing: i.listingId ? listingMap[i.listingId] ?? null : null,
  })))
}
