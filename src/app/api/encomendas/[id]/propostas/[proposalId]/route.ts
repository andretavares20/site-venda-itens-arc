import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { mpPayment } from "@/lib/mercadopago"

const COMMISSION_RATE = 0.10

function round2(n: number) { return Math.round(n * 100) / 100 }

type Params = { params: Promise<{ id: string; proposalId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id: encomendaId, proposalId } = await params
  const { action } = await req.json() // "ACEITAR" | "RECUSAR"

  const encomenda = await prisma.encomenda.findUnique({
    where: { id: encomendaId },
    include: { product: true, buyer: { select: { name: true, email: true } } },
  })
  if (!encomenda) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 })
  if (encomenda.buyerId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  if (encomenda.status !== "ABERTA") return NextResponse.json({ error: "Encomenda não está aberta" }, { status: 400 })

  const proposal = await prisma.encomendaProposal.findUnique({
    where: { id: proposalId },
    include: { seller: { select: { id: true, name: true } } },
  })
  if (!proposal || proposal.encomendaId !== encomendaId) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 })
  }
  if (proposal.status !== "PENDENTE") {
    return NextResponse.json({ error: "Proposta não está mais pendente" }, { status: 400 })
  }

  if (action === "RECUSAR") {
    await prisma.encomendaProposal.update({ where: { id: proposalId }, data: { status: "RECUSADA" } })
    await prisma.notification.create({
      data: {
        userId: proposal.sellerId,
        type: "ENCOMENDA_PROPOSAL_RECUSADA",
        title: "Proposta recusada",
        body: `Sua proposta para a encomenda de ${encomenda.product.name} foi recusada.`,
        link: `/encomendas/${encomendaId}`,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "ACEITAR") {
    const total = round2(Number(proposal.price) * encomenda.quantity)
    const commission = round2(total * COMMISSION_RATE)

    // Cria o pedido (sem stockId — encomenda ainda não tem estoque)
    const order = await prisma.order.create({
      data: {
        buyerId: session.user.id,
        total,
        commission,
        encomendaProposalId: proposalId,
        items: {
          create: [{
            quantity: encomenda.quantity,
            price: proposal.price,
          }],
        },
      },
    })

    // Gera PIX
    try {
      const [firstName, ...rest] = encomenda.buyer.name.split(" ")
      const payment = await mpPayment.create({
        body: {
          transaction_amount: total,
          description: `DropBay Encomenda #${order.id.slice(-8).toUpperCase()}`,
          payment_method_id: "pix",
          payer: {
            email: encomenda.buyer.email,
            first_name: firstName,
            last_name: rest.join(" ") || firstName,
          },
        },
      })

      const txData = payment.point_of_interaction?.transaction_data
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: String(payment.id),
          pixCode: txData?.qr_code ?? null,
          pixQrCode: txData?.qr_code_base64 ?? null,
          pixExpires: payment.date_of_expiration ? new Date(payment.date_of_expiration) : null,
          status: "PENDENTE",
        },
      })
    } catch (err) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELADO" } })
      console.error("Erro Mercado Pago:", err)
      return NextResponse.json({ error: "Erro ao gerar PIX. Tente novamente." }, { status: 500 })
    }

    // Aceita proposta, cancela demais, atualiza encomenda
    await prisma.$transaction([
      prisma.encomendaProposal.update({ where: { id: proposalId }, data: { status: "ACEITA" } }),
      prisma.encomendaProposal.updateMany({
        where: { encomendaId, id: { not: proposalId }, status: "PENDENTE" },
        data: { status: "CANCELADA" },
      }),
      prisma.encomenda.update({ where: { id: encomendaId }, data: { status: "ACEITA" } }),
    ])

    // Notifica vendedor vencedor
    await prisma.notification.create({
      data: {
        userId: proposal.sellerId,
        type: "ENCOMENDA_PROPOSAL_ACEITA",
        title: "Sua proposta foi aceita!",
        body: `O comprador aceitou sua proposta de R$ ${Number(proposal.price).toFixed(2)} para ${encomenda.product.name}. Aguarde o pagamento.`,
        link: `/encomendas/${encomendaId}`,
      },
    })

    // Notifica vendedores cancelados
    const cancelledProposals = await prisma.encomendaProposal.findMany({
      where: { encomendaId, id: { not: proposalId }, status: "CANCELADA" },
      select: { sellerId: true },
    })
    await prisma.notification.createMany({
      data: cancelledProposals.map((p) => ({
        userId: p.sellerId,
        type: "ENCOMENDA_PROPOSAL_CANCELADA",
        title: "Encomenda encerrada",
        body: `Uma outra proposta foi aceita para a encomenda de ${encomenda.product.name}.`,
        link: `/encomendas/${encomendaId}`,
      })),
    })

    return NextResponse.json({ orderId: order.id })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
