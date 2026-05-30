import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const challenges = await prisma.weeklyChallenge.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(challenges)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { title, description, active } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: "Título obrigatório" }, { status: 400 })

  const challenge = await prisma.weeklyChallenge.create({
    data: { title: title.trim(), description: description?.trim() || null, active: active ?? true },
  })

  return NextResponse.json(challenge)
}
