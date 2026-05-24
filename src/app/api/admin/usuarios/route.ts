import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
      createdAt: true,
      coupon: { select: { id: true, code: true, discountPercent: true, commissionPercent: true, active: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { userId, tier } = await req.json()
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: userId },
    data: { tier: tier ?? null },
    select: { id: true, tier: true },
  })

  // Se removeu tier e era ELITE_RIDER, desativa o cupom
  if (!tier) {
    await prisma.coupon.updateMany({
      where: { riderId: userId },
      data: { active: false },
    })
  }

  return NextResponse.json(user)
}
