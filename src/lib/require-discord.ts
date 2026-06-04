import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function requireDiscord(userId: string): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === "development") return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { discordId: true },
  })
  if (user?.discordId) return null
  return NextResponse.json(
    { error: "Conecte seu Discord antes de continuar. Acesse Minha Conta → Perfil.", code: "DISCORD_REQUIRED" },
    { status: 403 },
  )
}
