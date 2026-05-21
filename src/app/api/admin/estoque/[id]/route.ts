import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { id } = await params
  const { quantity, active } = await req.json()

  const data: { quantity?: number; active?: boolean } = {}
  if (quantity !== undefined) data.quantity = quantity
  if (active !== undefined) data.active = active

  // Se quantidade chegou a 0, desativa automaticamente
  if (data.quantity === 0) data.active = false
  if (data.quantity && data.quantity > 0 && active === undefined) data.active = true

  const stock = await prisma.stock.update({ where: { id }, data })
  return NextResponse.json(stock)
}
