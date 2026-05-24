import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendDiscordDM, dmNovaPropostaRecebida, dmPropostaEnviada } from "@/lib/discord"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Faça login para fazer uma proposta" }, { status: 401 })

  const { id: tradeId } = await params
  const { offerItems, note } = await req.json()

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { user: { select: { id: true, name: true, discordId: true } } },
  })
  if (!trade) return NextResponse.json({ error: "Troca não encontrada" }, { status: 404 })
  if (trade.status !== "ABERTA") return NextResponse.json({ error: "Esta troca não está mais disponível" }, { status: 400 })
  if (trade.userId === session.user.id) return NextResponse.json({ error: "Você não pode propor troca no seu próprio anúncio" }, { status: 400 })

  if (!offerItems?.length) return NextResponse.json({ error: "Adicione pelo menos um item na proposta" }, { status: 400 })

  const proposal = await prisma.tradeProposal.create({
    data: {
      tradeId,
      proposerId: session.user.id,
      note: note ?? null,
      offerItems: {
        create: offerItems.map((i: { productId: string; quantity: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      },
    },
    include: {
      proposer: { select: { id: true, name: true, discordId: true } },
      offerItems: { include: { product: true } },
    },
  })

  const itemNames = proposal.offerItems.map((i) => i.product.name).join(", ")
  const proposerName = proposal.proposer.name ?? "Jogador"
  const ownerName = trade.user.name ?? "Jogador"

  // In-app notification for trade owner
  await prisma.notification.create({
    data: {
      userId: trade.userId,
      type: "TRADE_PROPOSAL",
      title: "Nova proposta de troca",
      body: `${proposerName} quer trocar: ${itemNames}.`,
      link: `/trocas/${tradeId}`,
    },
  })

  // In-app notification for proposer (confirmation)
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "TRADE_PROPOSAL",
      title: "Proposta enviada",
      body: `Sua proposta para trocar ${itemNames} foi enviada com sucesso.`,
      link: `/trocas/${tradeId}`,
    },
  })

  // Discord DMs fire-and-forget
  if (trade.user.discordId) {
    sendDiscordDM(trade.user.discordId, dmNovaPropostaRecebida(ownerName, proposerName, itemNames)).catch(() => {})
  }
  if (proposal.proposer.discordId) {
    sendDiscordDM(proposal.proposer.discordId, dmPropostaEnviada(proposerName)).catch(() => {})
  }

  return NextResponse.json(proposal)
}
