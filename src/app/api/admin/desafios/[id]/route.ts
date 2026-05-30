import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { title, description, active } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })

  const challenge = await prisma.weeklyChallenge.update({
    where: { id },
    data: { title: title.trim(), description: description?.trim() || null, active },
  })

  return NextResponse.json(challenge)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.weeklyChallenge.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
