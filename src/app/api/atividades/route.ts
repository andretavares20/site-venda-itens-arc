import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireDiscord } from "@/lib/require-discord"

export async function GET() {
  const slots = await prisma.activitySlot.findMany({
    where: { status: "ABERTO" },
    include: {
      user: { select: { id: true, name: true, discordId: true } },
      challenge: { select: { id: true, title: true } },
      members: {
        include: { user: { select: { id: true, name: true, discordId: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(slots)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const discordErr = await requireDiscord(session.user.id)
  if (discordErr) return discordErr

  const { activity, subActivity, targetLevel, challengeId, scheduledAt } = await req.json()

  if (!activity) return NextResponse.json({ error: "Selecione uma atividade" }, { status: 400 })
  if (activity === "DESAFIOS_SEMANAIS" && !challengeId) {
    return NextResponse.json({ error: "Selecione um desafio" }, { status: 400 })
  }
  if (activity === "SUBIR_LEVEL" && (!subActivity || !targetLevel)) {
    return NextResponse.json({ error: "Selecione a bancada e o nível alvo" }, { status: 400 })
  }

  const slot = await prisma.activitySlot.create({
    data: {
      userId: session.user.id,
      activity,
      subActivity: subActivity || null,
      targetLevel: targetLevel || null,
      challengeId: challengeId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
    include: {
      user: { select: { id: true, name: true, discordId: true } },
      challenge: { select: { id: true, title: true } },
      members: { include: { user: { select: { id: true, name: true, discordId: true } } } },
    },
  })

  return NextResponse.json(slot)
}
