import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [user, reviews, listings] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.review.findMany({
      where: { receiverId: id, type: "COMPRADOR_PARA_VENDEDOR" },
      include: { giver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.count({
      where: { sellerId: id, status: { in: ["DISPONIVEL", "VENDIDO", "PARCIALMENTE_VENDIDO"] } },
    }),
  ])

  if (!user) return NextResponse.json({ error: "Vendedor não encontrado" }, { status: 404 })

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return NextResponse.json({ ...user, reviews, listings, avgRating })
}
