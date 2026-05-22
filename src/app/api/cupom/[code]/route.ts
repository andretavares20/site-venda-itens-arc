import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    select: {
      id: true,
      code: true,
      discountPercent: true,
      commissionPercent: true,
      active: true,
      rider: { select: { name: true } },
    },
  })

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Cupom inválido ou inativo" }, { status: 404 })
  }

  return NextResponse.json(coupon)
}
