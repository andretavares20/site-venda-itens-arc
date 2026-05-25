import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const base = (process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000/").replace(/\/?$/, "/")
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${base}api/auth/discord/callback`,
    response_type: "code",
    scope: "identify",
  })

  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params}`)
}
