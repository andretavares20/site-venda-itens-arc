import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

const include = {
  user: { select: { id: true, name: true } },
  offerItems: { include: { product: true } },
  wantItems:  { include: { product: true } },
  proposals: {
    include: {
      proposer: { select: { id: true, name: true } },
      offerItems: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Fecha automaticamente se expirou aguardando confirmação
  await prisma.trade.updateMany({
    where: { id, status: "AGUARDANDO_CONFIRMACAO", expiresAt: { lt: new Date() } },
    data: { status: "CANCELADA" },
  })

  const trade = await prisma.trade.findUnique({ where: { id }, include })
  if (!trade) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(trade)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()

  const trade = await prisma.trade.findUnique({ where: { id } })
  if (!trade) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  if (trade.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const updated = await prisma.trade.update({ where: { id }, data: { status } })
  return NextResponse.json(updated)
}
