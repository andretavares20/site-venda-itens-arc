import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { pixKey } = await req.json()
  if (!pixKey?.trim()) return NextResponse.json({ error: "Chave PIX inválida" }, { status: 400 })

  await prisma.user.update({ where: { id: session.user.id }, data: { pixKey } })
  return NextResponse.json({ ok: true })
}
