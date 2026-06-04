import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, pixKey: true, discordId: true, avatarUrl: true, createdAt: true },
  })

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Nome inválido" }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name.trim() },
    select: { name: true },
  })

  return NextResponse.json(user)
}
