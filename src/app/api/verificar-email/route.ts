import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.redirect(new URL("/login?erro=token-invalido", req.url))

  const user = await prisma.user.findUnique({ where: { verificationToken: token } })

  if (!user) return NextResponse.redirect(new URL("/login?erro=token-invalido", req.url))

  if (user.verificationExpires && user.verificationExpires < new Date()) {
    return NextResponse.redirect(new URL("/login?erro=token-expirado", req.url))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpires: null,
    },
  })

  return NextResponse.redirect(new URL("/login?verificado=1", req.url))
}
