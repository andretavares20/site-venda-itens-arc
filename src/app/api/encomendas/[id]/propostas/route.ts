import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { requireDiscord } from "@/lib/require-discord"
import { sendDiscordDM, dmNovaPropostaEncomenda } from "@/lib/discord"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const discordErr = await requireDiscord(session.user.id)
  if (discordErr) return discordErr

  const { id: encomendaId } = await params
  const { price, note } = await req.json()

  if (!price || price <= 0) {
    return NextResponse.json({ error: "Preço inválido" }, { status: 400 })
  }

  const encomenda = await prisma.encomenda.findUnique({ where: { id: encomendaId } })
  if (!encomenda) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 })
  if (encomenda.status !== "ABERTA") {
    return NextResponse.json({ error: "Esta encomenda não está mais aberta" }, { status: 400 })
  }
  if (encomenda.buyerId === session.user.id) {
    return NextResponse.json({ error: "Você não pode propor na sua própria encomenda" }, { status: 400 })
  }

  const existing = await prisma.encomendaProposal.findFirst({
    where: { encomendaId, sellerId: session.user.id, status: "PENDENTE" },
  })
  if (existing) {
    return NextResponse.json({ error: "Você já tem uma proposta pendente nesta encomenda" }, { status: 409 })
  }

  const proposal = await prisma.encomendaProposal.create({
    data: {
      encomendaId,
      sellerId: session.user.id,
      price,
      note: note ?? null,
    },
    include: { seller: { select: { name: true } } },
  })

  // Busca produto e discordId do comprador para notificações
  const [buyer, fullEncomenda] = await Promise.all([
    prisma.user.findUnique({ where: { id: encomenda.buyerId }, select: { name: true, discordId: true } }),
    prisma.encomenda.findUnique({ where: { id: encomendaId }, select: { product: { select: { name: true } } } }),
  ])

  const productName = fullEncomenda?.product?.name ?? "item"
  const buyerName   = buyer?.name ?? "Comprador"
  const sellerName  = proposal.seller.name

  // Notificação in-app
  await prisma.notification.create({
    data: {
      userId: encomenda.buyerId,
      type: "ENCOMENDA_PROPOSAL",
      title: "Nova proposta na sua encomenda!",
      body: `${sellerName} fez uma proposta de R$ ${Number(price).toFixed(2)}.`,
      link: `/encomendas/${encomendaId}`,
    },
  })

  // DM no Discord
  console.log(`[encomenda-proposta] nova proposta ${proposal.id} | encomenda ${encomendaId} | vendedor ${session.user.id} (${sellerName}) | comprador ${encomenda.buyerId} (${buyerName}) | discordId=${buyer?.discordId ?? "null"}`)

  if (buyer?.discordId) {
    const msg = dmNovaPropostaEncomenda(buyerName, sellerName, productName, Number(price))
    const sent = await sendDiscordDM(buyer.discordId, msg)
    console.log(`[encomenda-proposta] DM discord → buyerId=${encomenda.buyerId} discordId=${buyer.discordId} sent=${sent}`)
  } else {
    console.warn(`[encomenda-proposta] comprador ${encomenda.buyerId} sem discordId — DM não enviada`)
  }

  return NextResponse.json(proposal, { status: 201 })
}
