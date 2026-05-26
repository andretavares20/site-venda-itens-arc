import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

async function getTwitchToken(): Promise<string | null> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const username = searchParams.get("username")?.trim().toLowerCase()
  if (!username) return NextResponse.json({ error: "username obrigatório" }, { status: 400 })

  const token = await getTwitchToken()
  if (!token) return NextResponse.json({ error: "Falha ao autenticar na Twitch API" }, { status: 502 })

  const res = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
    headers: {
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
      "Authorization": `Bearer ${token}`,
    },
  })
  if (!res.ok) return NextResponse.json({ error: "Erro ao buscar usuário na Twitch" }, { status: 502 })

  const data = await res.json()
  const user = data.data?.[0]
  if (!user) return NextResponse.json({ error: "Usuário não encontrado na Twitch" }, { status: 404 })

  return NextResponse.json({
    avatarUrl: user.profile_image_url,
    bannerUrl: user.offline_image_url || null,
    displayName: user.display_name,
  })
}
