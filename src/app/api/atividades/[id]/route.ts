import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  const slot = await prisma.activitySlot.findUnique({ where: { id } })
  if (!slot) return NextResponse.json({ error: "Slot não encontrado" }, { status: 404 })
  if (slot.userId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  await prisma.activitySlot.update({ where: { id }, data: { status: "CANCELADO" } })

  return NextResponse.json({ ok: true })
}
