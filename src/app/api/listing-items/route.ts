import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")

  if (!slug) return NextResponse.json([], { status: 400 })

  const items = await prisma.stock.findMany({
    where: {
      active: true,
      quantity: { gt: 0 },
      product: { slug },
    },
    include: {
      seller: { select: { id: true, name: true } },
    },
    orderBy: { price: "asc" },
  })

  return NextResponse.json(
    items.map((s) => ({
      id: s.id,
      listingItemId: s.id,
      price: Number(s.price),
      quantity: s.quantity,
      seller: s.seller,
    }))
  )
}
