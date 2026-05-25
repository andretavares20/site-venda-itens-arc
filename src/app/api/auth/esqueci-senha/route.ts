import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })

  // Sempre retorna sucesso para não expor quais emails estão cadastrados
  if (!user) return NextResponse.json({ ok: true })

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: token, verificationExpires: expires },
  })

  await sendPasswordResetEmail(user.email, user.name, token)

  return NextResponse.json({ ok: true })
}
