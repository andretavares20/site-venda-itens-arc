import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

type Params = { params: Promise<{ id: string; proposalId: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id: tradeId, proposalId } = await params
  const { action } = await req.json() // "aceitar" | "recusar" | "cancelar" | "confirmar" | "reclamar"

  const [trade, proposal] = await Promise.all([
    prisma.trade.findUnique({
      where: { id: tradeId },
      include: { offerItems: true },
    }),
    prisma.tradeProposal.findUnique({
      where: { id: proposalId },
      include: { offerItems: true },
    }),
  ])

  async function checkStock(userId: string, items: { productId: string; quantity: number }[]) {
    for (const item of items) {
      const stock = await prisma.stock.findFirst({
        where: { sellerId: userId, productId: item.productId, active: true, quantity: { gte: item.quantity } },
      })
      if (!stock) return item.productId
    }
    return null
  }

  if (!trade || !proposal) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isOwner = trade.userId === session.user.id
  const isProposer = proposal.proposerId === session.user.id

  if (action === "aceitar") {
    if (!isOwner) return NextResponse.json({ error: "Apenas o dono pode aceitar propostas" }, { status: 403 })
    if (trade.status !== "ABERTA") return NextResponse.json({ error: "Troca não está aberta" }, { status: 400 })

    // Valida que os itens de ambos os lados ainda existem em estoque
    const missingOwner = await checkStock(trade.userId, trade.offerItems)
    if (missingOwner) return NextResponse.json({ error: "Um dos seus itens já não está mais disponível no estoque" }, { status: 400 })

    const missingProposer = await checkStock(proposal.proposerId, proposal.offerItems)
    if (missingProposer) return NextResponse.json({ error: "Um dos itens do proponente já não está mais disponível no estoque" }, { status: 400 })

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "ACEITA" } }),
      prisma.tradeProposal.updateMany({
        where: { tradeId, id: { not: proposalId }, status: "PENDENTE" },
        data: { status: "RECUSADA" },
      }),
      prisma.trade.update({ where: { id: tradeId }, data: { status: "AGUARDANDO_CONFIRMACAO", expiresAt } }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (action === "recusar") {
    if (!isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    await prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "RECUSADA" } })
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
      // Valida novamente antes de concluir (itens podem ter sido vendidos entre aceite e confirmação)
      const missingOwner = await checkStock(trade.userId, trade.offerItems)
      if (missingOwner) {
        await prisma.$transaction([
          prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "COM_RECLAMACAO" } }),
          prisma.trade.update({ where: { id: tradeId }, data: { status: "COM_RECLAMACAO" } }),
        ])
        return NextResponse.json({ error: "Um dos itens do dono não está mais disponível. Troca marcada como problemática." }, { status: 400 })
      }

      const missingProposer = await checkStock(proposal.proposerId, proposal.offerItems)
      if (missingProposer) {
        await prisma.$transaction([
          prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "COM_RECLAMACAO" } }),
          prisma.trade.update({ where: { id: tradeId }, data: { status: "COM_RECLAMACAO" } }),
        ])
        return NextResponse.json({ error: "Um dos itens do proponente não está mais disponível. Troca marcada como problemática." }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.tradeProposal.update({ where: { id: proposalId }, data: { status: "CONCLUIDA" } }),
        prisma.trade.update({ where: { id: tradeId }, data: { status: "CONCLUIDA" } }),
      ])
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
