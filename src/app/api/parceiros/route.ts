import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const partners = await prisma.partner.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, twitchUrl: true, avatarUrl: true, description: true },
  })
  return NextResponse.json(partners)
}
