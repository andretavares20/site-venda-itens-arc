import { NextResponse } from "next/server"

const BLOCK_WORDS = ["meme", "lol", "funny", "joke", "wtf", "cursed", "help", "question", "bug", "issue", "error", "problem", "how", "why", "what", "anyone", "anyone else", "does", "can i", "will", "when"]
const PREFER_WORDS = ["screenshot", "gameplay", "art", "fan", "render", "official", "wallpaper", "cinematic", "trailer", "look", "found", "amazing", "beautiful", "sick", "insane"]

type RedditPost = {
  data: {
    post_hint?: string
    url?: string
    title?: string
    score?: number
    preview?: {
      images?: {
        source?: { url?: string; width?: number; height?: number }
        resolutions?: { url?: string; width?: number; height?: number }[]
      }[]
    }
  }
}

async function fetchPosts(sort: string, time?: string) {
  const url = `https://www.reddit.com/r/arcraiders/${sort}.json?limit=50${time ? `&t=${time}` : ""}`
  const res = await fetch(url, {
    headers: { "User-Agent": "DropBay/1.0" },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data?.data?.children ?? []) as RedditPost[]
}

export async function GET() {
  try {
    const [topMonth, topAll] = await Promise.all([
      fetchPosts("top", "month"),
      fetchPosts("top", "all"),
    ])

    const allPosts = [...topMonth, ...topAll]

    const images = allPosts
      .filter(p => {
        const d = p.data
        if (d.post_hint !== "image") return false
        if ((d.score ?? 0) < 50) return false

        const title = d.title?.toLowerCase() ?? ""
        if (BLOCK_WORDS.some(w => title.includes(w))) return false

        return true
      })
      .map(p => {
        const d = p.data

        // Pega a resolução mais alta disponível nas previews
        const previews = d.preview?.images?.[0]?.resolutions ?? []
        const source = d.preview?.images?.[0]?.source

        // Prefere source (maior), senão a maior resolução disponível
        const best = source ?? previews[previews.length - 1]
        const imgUrl = best?.url?.replace(/&amp;/g, "&") ?? d.url

        if (!imgUrl) return null

        // Filtra imagens muito pequenas ou não-imagem
        if (best && ((best.width ?? 0) < 800 || (best.height ?? 0) < 400)) return null

        // Score de preferência (imagens temáticas sobem)
        const title = d.title?.toLowerCase() ?? ""
        const score = PREFER_WORDS.filter(w => title.includes(w)).length

        return { src: imgUrl, title: d.title?.slice(0, 80) ?? "Arc Raiders", score, redditScore: d.score ?? 0 }
      })
      .filter(Boolean)
      // Remove duplicatas por URL
      .filter((v, i, arr) => arr.findIndex(x => x?.src === v?.src) === i)
      // Ordena: imagens temáticas primeiro, depois por upvotes
      .sort((a, b) => (b!.score - a!.score) || (b!.redditScore - a!.redditScore))
      .slice(0, 10)
      .map((item) => ({ src: item!.src, title: item!.title }))

    return NextResponse.json(images)
  } catch {
    return NextResponse.json([])
  }
}
