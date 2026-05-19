import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { name, email, cpf, password } = await req.json()

  if (!name || !email || !cpf || !password) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 })
  }

  const cpfClean = cpf.replace(/\D/g, "")
  const cpfExists = await prisma.user.findUnique({ where: { cpf: cpfClean } })
  if (cpfExists) {
    return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado." }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { name, email, cpf: cpfClean, password: hashed } })

  return NextResponse.json({ ok: true })
}
