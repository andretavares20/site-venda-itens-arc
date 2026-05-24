import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendAdminAlert, sendDiscordDM, embedNovaTrocaAnunciada, dmTrocaAnunciada } from "@/lib/discord"

const include = {
  user: { select: { id: true, name: true } },
  offerItems: { include: { product: { select: { id: true, name: true, image: true, rarity: true } } } },
  wantItems:  { include: { product: { select: { id: true, name: true, image: true, rarity: true } } } },
  proposals:  { select: { id: true, status: true } },
}

async function closeExpiredTrades() {
  await prisma.trade.updateMany({
    where: {
      status: "AGUARDANDO_CONFIRMACAO",
      expiresAt: { lt: new Date() },
    },
    data: { status: "CANCELADA" },
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mine = searchParams.get("mine")
  const proposed = searchParams.get("proposed")
  const session = await auth()

  await closeExpiredTrades()

  const where = mine && session
    ? { userId: session.user.id }
    : proposed && session
    ? { proposals: { some: { proposerId: session.user.id } } }
    : { status: "ABERTA" as const }

  const trades = await prisma.trade.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(trades)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Faça login para anunciar troca" }, { status: 401 })

  const { offerItems, wantItems, note } = await req.json()

  if (!offerItems?.length) {
    return NextResponse.json({ error: "Adicione pelo menos um item para oferecer" }, { status: 400 })
  }

  const trade = await prisma.trade.create({
    data: {
      userId: session.user.id,
      note: note ?? null,
      offerItems: {
        create: offerItems.map((i: { productId: string; quantity: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      },
      wantItems: wantItems?.length ? {
        create: wantItems.map((i: { productId: string; quantity: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      } : undefined,
    },
    include,
  })

  prisma.user
    .findUnique({ where: { id: session.user.id }, select: { discordId: true } })
    .then((user) => {
      if (user?.discordId) {
        sendDiscordDM(user.discordId, dmTrocaAnunciada(session.user.name ?? "Jogador")).catch(() => {})
      }
      sendAdminAlert(embedNovaTrocaAnunciada({
        tradeId: trade.id,
        ownerName: session.user.name ?? "Jogador",
        ownerDiscord: user?.discordId ?? null,
        offerItems: trade.offerItems.map((i) => ({ name: i.product.name, quantity: i.quantity })),
        wantItems: trade.wantItems.map((i) => ({ name: i.product.name, quantity: i.quantity })),
      })).catch(() => {})
    })
    .catch(() => {})

  return NextResponse.json(trade)
}
