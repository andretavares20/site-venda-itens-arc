import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notify-admins"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const complaints = await prisma.complaint.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      order: { select: { id: true, total: true } },
      trade: { select: { id: true } },
      resolvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(complaints)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { orderId, tradeId, role, description } = await req.json()

  if (!description?.trim()) {
    return NextResponse.json({ error: "Descreva o problema" }, { status: 400 })
  }
  if (!orderId && !tradeId) {
    return NextResponse.json({ error: "Informe o pedido ou troca" }, { status: 400 })
  }
  if (!["COMPRADOR", "VENDEDOR"].includes(role)) {
    return NextResponse.json({ error: "Role inválido" }, { status: 400 })
  }

  // Verifica se o usuário tem acesso ao pedido/troca
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { stock: { select: { sellerId: true } } } } },
    })
    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

    const isBuyer = order.buyerId === session.user.id
    const isSeller = order.items.some((i) => i.stock?.sellerId === session.user.id)
    if (!isBuyer && !isSeller) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

    // Verifica se já tem reclamação aberta
    const existing = await prisma.complaint.findFirst({
      where: { orderId, userId: session.user.id, status: "ABERTA" },
    })
    if (existing) return NextResponse.json({ error: "Você já tem uma reclamação aberta neste pedido" }, { status: 400 })
  }

  if (tradeId) {
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { proposals: { where: { status: "ACEITA" }, select: { proposerId: true } } },
    })
    if (!trade) return NextResponse.json({ error: "Troca não encontrada" }, { status: 404 })

    const isOwner = trade.userId === session.user.id
    const isProposer = trade.proposals.some((p) => p.proposerId === session.user.id)
    if (!isOwner && !isProposer) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const complaint = await prisma.complaint.create({
    data: {
      orderId: orderId ?? null,
      tradeId: tradeId ?? null,
      userId: session.user.id,
      role,
      description,
    },
  })

  // Atualiza status do pedido/troca para COM_RECLAMACAO
  if (orderId) {
    await prisma.order.update({ where: { id: orderId }, data: { status: "COM_RECLAMACAO" } })
  }
  if (tradeId) {
    await prisma.trade.update({ where: { id: tradeId }, data: { status: "COM_RECLAMACAO" } })
  }

  const ref = orderId ? `pedido #${(orderId as string).slice(-8).toUpperCase()}` : `troca #${(tradeId as string).slice(-8).toUpperCase()}`
  await notifyAdmins(
    "COMPLAINT_OPENED",
    `Nova reclamação — ${ref}`,
    `${session.user.name ?? "Usuário"} (${role === "COMPRADOR" ? "comprador" : "vendedor"}) abriu uma reclamação: ${description.slice(0, 80)}`,
    "/admin/reclamacoes",
  )

  return NextResponse.json(complaint, { status: 201 })
}
