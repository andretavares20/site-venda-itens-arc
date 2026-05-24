import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const encomenda = await prisma.encomenda.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, name: true } },
      product: true,
      proposals: {
        include: { seller: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!encomenda) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(encomenda)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  const encomenda = await prisma.encomenda.findUnique({ where: { id } })
  if (!encomenda) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  if (encomenda.buyerId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  if (encomenda.status !== "ABERTA") {
    return NextResponse.json({ error: "Não é possível cancelar após aceitar uma proposta" }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.encomendaProposal.updateMany({
      where: { encomendaId: id, status: "PENDENTE" },
      data: { status: "CANCELADA" },
    }),
    prisma.encomenda.update({
      where: { id },
      data: { status: "CANCELADA" },
    }),
  ])

  return NextResponse.json({ ok: true })
}
