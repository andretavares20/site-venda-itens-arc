import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  const membership = await prisma.activitySlotMember.findUnique({
    where: { slotId_userId: { slotId: id, userId: session.user.id } },
  })

  if (!membership) return NextResponse.json({ error: "Você não está neste grupo" }, { status: 404 })

  await prisma.activitySlotMember.delete({
    where: { slotId_userId: { slotId: id, userId: session.user.id } },
  })

  // Se estava cheio, reabre
  await prisma.activitySlot.updateMany({
    where: { id, status: "CHEIO" },
    data: { status: "ABERTO" },
  })

  return NextResponse.json({ ok: true })
}
