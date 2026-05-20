import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendPixToSeller } from "@/lib/asaas"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params
  const { action } = await req.json() // "pagar" | "cancelar"

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  })
  if (!withdrawal) return NextResponse.json({ error: "Saque não encontrado" }, { status: 404 })

  if (action === "cancelar") {
    // Devolve o saldo ao vendedor
    await prisma.$transaction([
      prisma.withdrawal.update({ where: { id }, data: { status: "CANCELADO" } }),
      prisma.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: Number(withdrawal.amount) } },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (action === "pagar") {
    try {
      await sendPixToSeller({
        pixKey: withdrawal.pixKey,
        amount: Number(withdrawal.amount),
        description: `DropBay - Saque #${id.slice(-8).toUpperCase()}`,
        externalReference: `saque-${id}`,
      })

      await prisma.withdrawal.update({ where: { id }, data: { status: "PAGO" } })
      return NextResponse.json({ ok: true, pixSent: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao processar PIX"
      return NextResponse.json({ ok: false, error: msg }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}
