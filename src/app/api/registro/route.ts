import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { name, email, password: hashed } })

  return NextResponse.json({ ok: true })
}
