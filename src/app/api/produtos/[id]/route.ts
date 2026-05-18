import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return null
  return session
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  const body = await req.json()
  const product = await prisma.product.update({ where: { id }, data: body })
  return NextResponse.json({ ...product, price: Number(product.price) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  const { id } = await params
  await prisma.product.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
