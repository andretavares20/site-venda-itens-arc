import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

const include = {
  user: { select: { id: true, name: true } },
  offerItems: { include: { product: { select: { id: true, name: true, image: true, rarity: true } } } },
  wantItems:  { include: { product: { select: { id: true, name: true, image: true, rarity: true } } } },
  proposals:  { select: { id: true, status: true } },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mine = searchParams.get("mine")
  const session = await auth()

  const where = mine && session
    ? { userId: session.user.id }
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

  return NextResponse.json(trade)
}
