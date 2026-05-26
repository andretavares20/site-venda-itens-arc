import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { sendAdminAlert, sendDiscordDM, embedNovaEncomenda, dmEncomendaCriada } from "@/lib/discord"
import { notifyAdmins } from "@/lib/notify-admins"
import { requireDiscord } from "@/lib/require-discord"

export async function GET() {
  const encomendas = await prisma.encomenda.findMany({
    where: { status: "ABERTA" },
    include: {
      buyer: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, image: true, category: true } },
      proposals: { where: { status: "PENDENTE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(encomendas)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const discordErr = await requireDiscord(session.user.id)
  if (discordErr) return discordErr

  const { productId, quantity, maxPrice, note } = await req.json()

  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })

  const encomenda = await prisma.encomenda.create({
    data: {
      buyerId: session.user.id,
      productId,
      quantity,
      maxPrice: maxPrice ?? null,
      note: note ?? null,
    },
  })

  const buyerName = session.user.name ?? "Comprador"

  // In-app notification for admins
  notifyAdmins(
    "NEW_ORDER",
    "Nova encomenda criada",
    `${buyerName} encomendou: ${product.name} (x${quantity}).`,
    `/encomendas`,
  ).catch(() => {})

  // Fetch buyer's Discord ID then send notifications sequentially
  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { discordId: true },
  })

  // Fire-and-forget DM to buyer
  if (buyer?.discordId) {
    sendDiscordDM(buyer.discordId, dmEncomendaCriada(buyerName, product.name)).catch(() => {})
  }

  // Await so Vercel doesn't terminate before the alert is sent
  await sendAdminAlert(embedNovaEncomenda({
    encomendaId: encomenda.id,
    buyerName,
    buyerDiscord: buyer?.discordId ?? null,
    productName: product.name,
    quantity,
    maxPrice: maxPrice != null ? Number(maxPrice) : null,
  }))

  return NextResponse.json(encomenda, { status: 201 })
}
