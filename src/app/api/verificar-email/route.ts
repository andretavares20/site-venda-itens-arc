import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET não tem efeito colateral — apenas encaminha para a página de confirmação.
// Isso evita que scanners de segurança de email consumam o token ao pré-visitar o link.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.redirect(new URL("/login?erro=token-invalido", req.url))

  return NextResponse.redirect(new URL(`/verificar-email?token=${token}`, req.url))
}

// POST é disparado apenas por uma ação explícita do usuário (clique no botão de confirmação).
export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "token-invalido" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { verificationToken: token } })
  if (!user) return NextResponse.json({ error: "token-invalido" }, { status: 400 })

  if (user.verificationExpires && user.verificationExpires < new Date()) {
    return NextResponse.json({ error: "token-expirado" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpires: null,
    },
  })

  return NextResponse.json({ ok: true })
}
