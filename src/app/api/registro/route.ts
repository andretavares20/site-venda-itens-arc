import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"
import { randomBytes } from "crypto"

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
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await prisma.user.create({
    data: {
      name,
      email,
      cpf: cpfClean,
      password: hashed,
      verificationToken: token,
      verificationExpires: expires,
    },
  })

  await sendVerificationEmail(email, name, token)

  return NextResponse.json({ ok: true })
}
