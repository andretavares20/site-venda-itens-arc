import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireDiscord } from "@/lib/require-discord"
import { sendDiscordDM } from "@/lib/discord"

const ACTIVITY_LABELS: Record<string, string> = {
  SUBIR_LEVEL: "Subir level",
  FARM_XP: "Farm de XP",
  COLECOES: "Concluir coletâneas",
  DESAFIOS_SEMANAIS: "Desafios semanais",
  PROJETOS: "Concluir projetos",
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const discordErr = await requireDiscord(session.user.id)
  if (discordErr) return discordErr

  const { id } = await params

  const slot = await prisma.activitySlot.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, discordId: true } },
      members: { include: { user: { select: { id: true, name: true, discordId: true } } } },
      challenge: { select: { title: true } },
    },
  })

  if (!slot) return NextResponse.json({ error: "Slot não encontrado" }, { status: 404 })
  if (slot.status !== "ABERTO") return NextResponse.json({ error: "Este grupo não está mais disponível" }, { status: 400 })
  if (slot.userId === session.user.id) return NextResponse.json({ error: "Você é o criador deste grupo" }, { status: 400 })
  if (slot.members.some((m) => m.userId === session.user.id)) {
    return NextResponse.json({ error: "Você já está neste grupo" }, { status: 400 })
  }
  if (slot.members.length >= 2) {
    return NextResponse.json({ error: "Grupo cheio" }, { status: 400 })
  }

  const joiner = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, discordId: true },
  })

  await prisma.activitySlotMember.create({ data: { slotId: id, userId: session.user.id } })

  if (slot.members.length + 1 >= 2) {
    await prisma.activitySlot.update({ where: { id }, data: { status: "CHEIO" } })
  }

  const allParticipants = [
    { name: slot.user.name, discordId: slot.user.discordId },
    ...slot.members.map((m) => ({ name: m.user.name, discordId: m.user.discordId })),
    { name: joiner?.name ?? "Alguém", discordId: joiner?.discordId ?? null },
  ]

  const activityLabel = ACTIVITY_LABELS[slot.activity] ?? slot.activity
  const challengeLabel = slot.challenge ? ` — ${slot.challenge.title}` : ""
  const memberList = allParticipants
    .map((p) => (p.discordId ? `<@${p.discordId}>` : p.name))
    .join(", ")

  const message =
    `🎮 **${joiner?.name ?? "Alguém"}** entrou no grupo de **${activityLabel}${challengeLabel}**!\n\n` +
    `Grupo atual: ${memberList}\n\n` +
    `Falem diretamente pelo Discord para combinar! 🚀`

  for (const p of allParticipants) {
    if (p.discordId) sendDiscordDM(p.discordId, message).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
