import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { riderId, code, discountPercent, commissionPercent } = await req.json()
  if (!riderId || !code) return NextResponse.json({ error: "riderId e code são obrigatórios" }, { status: 400 })

  const rider = await prisma.user.findUnique({ where: { id: riderId }, select: { tier: true } })
  if (rider?.tier !== "ELITE_RIDER") return NextResponse.json({ error: "Usuário não é Elite Rider" }, { status: 400 })

  // Upsert: se já tem cupom, atualiza
  const coupon = await prisma.coupon.upsert({
    where: { riderId },
    create: {
      riderId,
      code: code.toUpperCase(),
      discountPercent: Number(discountPercent ?? 0),
      commissionPercent: Number(commissionPercent ?? 5),
      active: true,
    },
    update: {
      code: code.toUpperCase(),
      discountPercent: Number(discountPercent ?? 0),
      commissionPercent: Number(commissionPercent ?? 5),
      active: true,
    },
  })

  return NextResponse.json(coupon)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { couponId, active } = await req.json()
  if (!couponId) return NextResponse.json({ error: "couponId obrigatório" }, { status: 400 })

  const coupon = await prisma.coupon.update({
    where: { id: couponId },
    data: { active },
  })

  return NextResponse.json(coupon)
}
