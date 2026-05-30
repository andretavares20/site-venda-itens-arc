import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireDiscord } from "@/lib/require-discord"
import { createPrivateChannel, addMemberToDiscordChannel, embedSquadCriado } from "@/lib/discord"

const ACTIVITY_LABELS: Record<string, string> = {
  SUBIR_LEVEL: "Subir level", FARM_XP: "Farm de XP", COLECOES: "Concluir coletâneas",
  DESAFIOS_SEMANAIS: "Desafios semanais", PROJETOS: "Concluir projetos",
}
const BENCH_LABELS: Record<string, string> = {
  SUCATINHA: "Sucatinha", ARMEIRO: "Armeiro", BANCADA_EQUIPAMENTOS: "Bancada de Equipamentos",
  ESTACAO_EXPLOSIVOS: "Estação de Explosivos", ESTACAO_UTILIDADES: "Estação de Utilidades",
  LABORATORIO_MEDICO: "Laboratório Médico", REFINADOR: "Refinador",
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

  const newTotal = slot.members.length + 1
  if (newTotal >= 2) {
    await prisma.activitySlot.update({ where: { id }, data: { status: "CHEIO" } })
  }

  // Todos os participantes (dono + membros anteriores + novo)
  const allParticipants = [
    { name: slot.user.name, discordId: slot.user.discordId },
    ...slot.members.map((m) => ({ name: m.user.name, discordId: m.user.discordId })),
    { name: joiner?.name ?? "Alguém", discordId: joiner?.discordId ?? null },
  ]

  const discordIds = allParticipants.map((p) => p.discordId).filter(Boolean) as string[]

  // Monta label da atividade para o nome do canal
  let activityLabel = ACTIVITY_LABELS[slot.activity] ?? slot.activity
  if (slot.subActivity) activityLabel += ` · ${BENCH_LABELS[slot.subActivity] ?? slot.subActivity}`
  if (slot.targetLevel) activityLabel += ` → Nível ${slot.targetLevel}`
  if (slot.challenge) activityLabel += ` — ${slot.challenge.title}`

  if (slot.discordChannelId) {
    // Canal já existe — adiciona o novo membro
    if (joiner?.discordId) {
      addMemberToDiscordChannel(slot.discordChannelId, joiner.discordId).catch(() => {})
    }
  } else {
    // Cria o canal agora com todos os participantes
    createPrivateChannel({
      name:            `squad-${id.slice(-8).toLowerCase()}`,
      topic:           `Squad · ${activityLabel}`,
      memberDiscordIds: discordIds,
      introEmbed:      embedSquadCriado({
        activity:    slot.activity,
        subActivity: slot.subActivity,
        targetLevel: slot.targetLevel,
        members:     allParticipants,
      }),
    }).then((channelId) => {
      if (channelId) {
        prisma.activitySlot.update({ where: { id }, data: { discordChannelId: channelId } }).catch(() => {})
      }
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
