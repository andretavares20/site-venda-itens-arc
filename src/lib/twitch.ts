async function getToken(): Promise<string | null> {
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

export function extractTwitchUsername(url: string): string | null {
  const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i)
  return match?.[1]?.toLowerCase() ?? null
}

/** Retorna um Set com os usernames que estão ao vivo agora */
export async function getLiveUsernames(usernames: string[]): Promise<Set<string>> {
  if (!usernames.length) return new Set()

  const token = await getToken()
  if (!token) return new Set()

  const query = usernames.map((u) => `user_login=${encodeURIComponent(u)}`).join("&")
  const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
    headers: {
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) return new Set()

  const data = await res.json()
  return new Set<string>((data.data ?? []).map((s: { user_login: string }) => s.user_login.toLowerCase()))
}
