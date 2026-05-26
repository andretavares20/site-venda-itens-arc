import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const partners = await prisma.partner.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json(partners)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { name, twitchUrl, avatarUrl, bannerUrl, description, active, order } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })

  const partner = await prisma.partner.create({
    data: {
      name: name.trim(),
      twitchUrl: twitchUrl?.trim() || null,
      avatarUrl: avatarUrl?.trim() || null,
      bannerUrl: bannerUrl?.trim() || null,
      description: description?.trim() || null,
      active: active ?? true,
      order: order ?? 0,
    },
  })
  return NextResponse.json(partner, { status: 201 })
}
