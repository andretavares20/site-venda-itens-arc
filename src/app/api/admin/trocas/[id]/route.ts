import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendDiscordDM, dmTrocaConcluida } from "@/lib/discord"

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id: tradeId } = await params
  const { action } = await req.json() // "recolheu" | "entregou"

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      user: { select: { name: true, discordId: true } },
      proposals: {
        where: { status: { in: ["ACEITA", "CONCLUIDA"] } },
        include: {
          proposer: { select: { name: true, discordId: true } },
        },
      },
    },
  })

  if (!trade) return NextResponse.json({ error: "Troca não encontrada" }, { status: 404 })

  if (action === "recolheu") {
    if (trade.status !== "AGUARDANDO_RECOLHIMENTO") {
      return NextResponse.json({ error: "Status inválido para esta ação" }, { status: 400 })
    }
    await prisma.trade.update({ where: { id: tradeId }, data: { status: "AGUARDANDO_ENTREGA" } })
    return NextResponse.json({ ok: true })
  }

  if (action === "entregou") {
    if (trade.status !== "AGUARDANDO_ENTREGA") {
      return NextResponse.json({ error: "Status inválido para esta ação" }, { status: 400 })
    }

    const acceptedProposal = trade.proposals[0]

    await prisma.$transaction([
      prisma.trade.update({ where: { id: tradeId }, data: { status: "CONCLUIDA" } }),
      ...(acceptedProposal
        ? [prisma.tradeProposal.update({ where: { id: acceptedProposal.id }, data: { status: "CONCLUIDA" } })]
        : []),
    ])

    // DM para ambos os jogadores (fire and forget)
    if (trade.user.discordId) {
      sendDiscordDM(trade.user.discordId, dmTrocaConcluida(trade.user.name)).catch(() => {})
    }
    if (acceptedProposal?.proposer.discordId) {
      sendDiscordDM(
        acceptedProposal.proposer.discordId,
        dmTrocaConcluida(acceptedProposal.proposer.name),
      ).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
