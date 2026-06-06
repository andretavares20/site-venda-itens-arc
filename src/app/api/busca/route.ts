import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const results = await prisma.product.findMany({
    where: { active: true, name: { contains: q, mode: "insensitive" } },
    select: { name: true, slug: true, image: true, category: true, rarity: true },
    orderBy: { name: "asc" },
    take: 6,
  })

  return NextResponse.json(results)
}
