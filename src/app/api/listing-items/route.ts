import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")

  if (!slug) return NextResponse.json([], { status: 400 })

  const items = await prisma.listingItem.findMany({
    where: {
      status: "DISPONIVEL",
      listing: { status: "DISPONIVEL" },
      product: { slug },
    },
    include: {
      listing: { include: { seller: { select: { id: true, name: true } } } },
    },
    orderBy: { price: "asc" },
  })

  return NextResponse.json(
    items.map((i) => ({
      id: i.listing.id,
      listingItemId: i.id,
      price: Number(i.price),
      quantity: i.quantity,
      seller: i.listing.seller,
    }))
  )
}
