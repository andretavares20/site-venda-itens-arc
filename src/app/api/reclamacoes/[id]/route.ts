import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params
  const { resolution } = await req.json()

  if (!resolution?.trim()) {
    return NextResponse.json({ error: "Informe a resolução" }, { status: 400 })
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { order: { select: { id: true } }, trade: { select: { id: true } } },
  })

  if (!complaint) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  if (complaint.status === "RESOLVIDA") return NextResponse.json({ error: "Já resolvida" }, { status: 400 })

  await prisma.complaint.update({
    where: { id },
    data: { status: "RESOLVIDA", resolution, resolvedAt: new Date(), resolvedById: session.user.id },
  })

  // Notifica o usuário que abriu a reclamação
  await prisma.notification.create({
    data: {
      userId: complaint.userId,
      type: "COMPLAINT_RESOLVED",
      title: "Reclamação resolvida",
      body: `Sua reclamação foi analisada pela administração: ${resolution}`,
      link: complaint.orderId ? `/pedido/${complaint.orderId}` : `/trocas/${complaint.tradeId}`,
    },
  })

  return NextResponse.json({ ok: true })
}
