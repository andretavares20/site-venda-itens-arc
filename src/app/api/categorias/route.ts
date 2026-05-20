import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const result = await prisma.product.groupBy({
    by: ["category"],
    where: { active: true },
    orderBy: { category: "asc" },
  })
  return NextResponse.json(result.map((r) => r.category))
}
