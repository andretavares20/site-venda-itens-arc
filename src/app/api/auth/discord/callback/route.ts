import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000/"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.redirect(`${BASE_URL}login`)

  const code = req.nextUrl.searchParams.get("code")
  if (!code) return NextResponse.redirect(`${BASE_URL}minha-conta/perfil?discord=erro`)

  // Troca o code pelo access token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${BASE_URL}api/auth/discord/callback`,
    }),
  })

  if (!tokenRes.ok) return NextResponse.redirect(`${BASE_URL}minha-conta/perfil?discord=erro`)

  const { access_token } = await tokenRes.json()

  // Busca os dados do usuário Discord
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userRes.ok) return NextResponse.redirect(`${BASE_URL}minha-conta/perfil?discord=erro`)

  const discordUser = await userRes.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: { discordId: discordUser.id },
  })

  return NextResponse.redirect(`${BASE_URL}minha-conta/perfil?discord=ok`)
}
