import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { id } = await params
  const { name, twitchUrl, avatarUrl, bannerUrl, description, active, order } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 })

  const partner = await prisma.partner.update({
    where: { id },
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
  return NextResponse.json(partner)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { id } = await params
  await prisma.partner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
