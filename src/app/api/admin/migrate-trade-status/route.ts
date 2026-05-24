import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  if (secret !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  await prisma.$executeRawUnsafe(
    `ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_RECOLHIMENTO'`
  )
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "TradeStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_ENTREGA'`
  )

  return NextResponse.json({ ok: true, message: "Migração executada com sucesso" })
}
