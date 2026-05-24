import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

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

  return NextResponse.json(encomenda, { status: 201 })
}
