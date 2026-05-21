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
      listing: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(items.map(i => ({
    ...i,
    price: Number(i.price),
  })))
}
