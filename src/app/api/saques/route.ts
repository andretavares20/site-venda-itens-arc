import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

const SAQUE_MINIMO = 5.00

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const where = session.user.role === "ADMIN" ? {} : { userId: session.user.id }
  const withdrawals = await prisma.withdrawal.findMany({
    where,
    include: { user: { select: { name: true, email: true, pixKey: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(withdrawals)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Faça login para continuar" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true, pixKey: true },
  })

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  if (!user.pixKey) return NextResponse.json({ error: "Cadastre sua chave PIX antes de solicitar saque" }, { status: 400 })

  const balance = Number(user.balance)
  if (balance < SAQUE_MINIMO) {
    return NextResponse.json({
      error: `Saldo insuficiente. Mínimo para saque é R$ ${SAQUE_MINIMO.toFixed(2)}. Seu saldo: R$ ${balance.toFixed(2)}`
    }, { status: 400 })
  }

  // Cria solicitação de saque e zera saldo atomicamente
  const [withdrawal] = await prisma.$transaction([
    prisma.withdrawal.create({
      data: {
        userId: session.user.id,
        amount: balance,
        pixKey: user.pixKey,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { balance: 0 },
    }),
  ])

  return NextResponse.json(withdrawal)
}
