import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notify-admins"
import { sendDiscordDM, dmPropostaAceita, dmTrocaConcluida, createPrivateChannel, embedCanalTroca, deleteDiscordChannel } from "@/lib/discord"

type Params = { params: Promise<{ id: string; proposalId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id: tradeId, proposalId } = await params
  const { action } = await req.json() // "aceitar" | "recusar" | "cancelar" | "confirmar" | "reclamar"

  const [trade, proposal] = await Promise.all([
    prisma.trade.findUnique({
      where: { id: tradeId },
      include: { offerItems: { include: { product: { select: { name: true } } } } },
    }),
    prisma.tradeProposal.findUnique({
      where: { id: proposalId },
      include: { offerItems: { include: { product: { select: { name: true } } } } },
    }),
  ])

  if (!trade || !proposal) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isOwner = trade.userId === session.user.id
  const isProposer = proposal.proposerId === session.user.id

  if (action === "aceitar") {
    if (!isOwner) return NextResponse.json({ error: "Apenas o dono pode aceitar propostas" }, { status: 403 })
    if (trade.status !== "ABERTA") return NextResponse.json({ error: "Troca não está aberta" }, { status: 400 })

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Busca outras propostas pendentes antes da transação para saber quem notificar
    const cancelledProposals = await prisma.tradeProposal.findMany({
      where: { tradeId, id: { not: proposalId }, status: "PENDENTE" },
      select: { proposerId: true },
    })

    await prisma.$transaction([
      prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "ACEITA" } }),
      prisma.tradeProposal.updateMany({
        where: { tradeId, id: { not: proposalId }, status: "PENDENTE" },
        data: { status: "RECUSADA" },
      }),
      prisma.trade.update({ where: { id: tradeId }, data: { status: "AGUARDANDO_CONFIRMACAO", expiresAt } }),
    ])

    // DM para proponente + criação do canal privado (awaited para garantir que o channelId seja salvo)
    const [owner, proposer] = await Promise.all([
      prisma.user.findUnique({ where: { id: trade.userId },        select: { name: true, discordId: true } }),
      prisma.user.findUnique({ where: { id: proposal.proposerId }, select: { name: true, discordId: true } }),
    ])

    if (proposer?.discordId) {
      sendDiscordDM(proposer.discordId, dmPropostaAceita(proposer.name ?? "Jogador")).catch(() => {})
    }

    const tradeCode = tradeId.slice(-8).toUpperCase()
    const slug = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 18)
    const itemASlug = slug(trade.offerItems[0]?.product.name ?? "item")
    const itemBSlug = slug(proposal.offerItems[0]?.product.name ?? "item")
    const memberIds = [owner?.discordId, proposer?.discordId].filter(Boolean) as string[]
    const channelId = await createPrivateChannel({
      name: `troca-${itemASlug}-x-${itemBSlug}-${tradeCode.toLowerCase()}`,
      topic: `Troca #${tradeCode} · ${owner?.name ?? "Jogador A"} ↔ ${proposer?.name ?? "Jogador B"} · ${trade.offerItems[0]?.product.name ?? "?"} x ${proposal.offerItems[0]?.product.name ?? "?"}`,
      memberDiscordIds: memberIds,
      introEmbed: embedCanalTroca({
        tradeId: tradeCode,
        ownerName:     owner?.name    ?? "Jogador A",
        ownerDiscord:  owner?.discordId  ?? null,
        proposerName:  proposer?.name ?? "Jogador B",
        proposerDiscord: proposer?.discordId ?? null,
        ownerItems:    trade.offerItems.map((i) => ({ name: i.product.name, quantity: i.quantity })),
        proposerItems: proposal.offerItems.map((i) => ({ name: i.product.name, quantity: i.quantity })),
      }),
    }).catch(() => null)
    if (channelId) {
      await prisma.trade.update({ where: { id: tradeId }, data: { discordChannelId: channelId } })
    }

    // Notifica o proponente aceito
    await prisma.notification.create({
      data: {
        userId: proposal.proposerId,
        type: "TRADE_PROPOSAL_ACCEPTED",
        title: "Proposta aceita!",
        body: "Sua proposta de troca foi aceita. Confirme para concluir.",
        link: `/trocas/${tradeId}`,
      },
    })

    // Notifica os proponentes cujas propostas foram canceladas
    if (cancelledProposals.length > 0) {
      await prisma.notification.createMany({
        data: cancelledProposals.map((p) => ({
          userId: p.proposerId,
          type: "TRADE_PROPOSAL_REJECTED",
          title: "Proposta não selecionada",
          body: "Outra proposta foi aceita nesta troca. Sua proposta foi cancelada.",
          link: `/trocas/${tradeId}`,
        })),
      })
    }

    return NextResponse.json({ ok: true })
  }

  if (action === "recusar") {
    if (!isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    await prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "RECUSADA" } })

    await prisma.notification.create({
      data: {
        userId: proposal.proposerId,
        type: "TRADE_PROPOSAL_REJECTED",
        title: "Proposta recusada",
        body: "Sua proposta de troca foi recusada pelo dono do anúncio.",
        link: `/trocas/${tradeId}`,
      },
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "cancelar") {
    if (!isProposer) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (proposal.status !== "PENDENTE") return NextResponse.json({ error: "Proposta já foi processada" }, { status: 400 })
    await prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "CANCELADA" } })
    return NextResponse.json({ ok: true })
  }

  if (action === "confirmar") {
    if (!isOwner && !isProposer) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (proposal.status !== "ACEITA") return NextResponse.json({ error: "Proposta não está aceita" }, { status: 400 })

    const data = isOwner
      ? { ownerConfirmed: true }
      : { proposerConfirmed: true }

    const updated = await prisma.tradeProposal.update({ where: { id: proposalId }, data })

    const bothConfirmed = updated.ownerConfirmed && updated.proposerConfirmed
    if (bothConfirmed) {
      const tradeCode = tradeId.slice(-8).toUpperCase()

      await prisma.$transaction([
        prisma.trade.update({ where: { id: tradeId }, data: { status: "CONCLUIDA" } }),
        prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "CONCLUIDA" } }),
      ])

      const fullTrade = await prisma.trade.findUnique({
        where: { id: tradeId },
        include: {
          user: { select: { name: true, discordId: true } },
          offerItems: { include: { product: { select: { name: true } } } },
          proposals: {
            where: { id: proposalId },
            include: {
              proposer: { select: { name: true, discordId: true } },
              offerItems: { include: { product: { select: { name: true } } } },
            },
          },
        },
      })

      if (fullTrade) {
        const ap = fullTrade.proposals[0]

        // DM de conclusão para ambos os jogadores
        if (fullTrade.user.discordId) {
          sendDiscordDM(fullTrade.user.discordId, dmTrocaConcluida(fullTrade.user.name)).catch(() => {})
        }
        if (ap?.proposer.discordId) {
          sendDiscordDM(ap.proposer.discordId, dmTrocaConcluida(ap.proposer.name)).catch(() => {})
        }

        // Notifica admins in-app sobre conclusão
        notifyAdmins(
          "TRADE_READY",
          `Troca concluída — #${tradeCode}`,
          "Ambos os jogadores confirmaram a troca via Discord.",
          "/admin/trocas",
        ).catch(() => {})

        // Deleta canal privado pois a troca foi concluída
        if (fullTrade.discordChannelId) {
          deleteDiscordChannel(fullTrade.discordChannelId).catch(() => {})
        }
      }
    }

    return NextResponse.json({ ok: true, concluida: bothConfirmed })
  }

  if (action === "reclamar") {
    if (!isOwner && !isProposer) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    await prisma.$transaction([
      prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "COM_RECLAMACAO" } }),
      prisma.trade.update({ where: { id: tradeId }, data: { status: "COM_RECLAMACAO" } }),
    ])
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
