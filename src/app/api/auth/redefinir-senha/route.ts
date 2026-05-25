import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationExpires: { gt: new Date() },
    },
  })

  if (!user) return NextResponse.json({ error: "Link inválido ou expirado" }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      verificationToken: null,
      verificationExpires: null,
    },
  })

  return NextResponse.json({ ok: true })
}
