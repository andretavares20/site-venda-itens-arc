import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  const busca = searchParams.get("busca")

  if (slug) {
    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) return NextResponse.json(null, { status: 404 })
    return NextResponse.json({ ...product, suggestedPrice: Number(product.suggestedPrice) })
  }

  const category = searchParams.get("categoria") ?? undefined
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(category ? { category } : {}),
      ...(busca ? { name: { contains: busca, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    take: busca ? 20 : undefined,
  })
  return NextResponse.json(products.map((p) => ({ ...p, suggestedPrice: Number(p.suggestedPrice) })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { name, slug, description, suggestedPrice, image, category, rarity } = body

  if (!name || !slug || !image) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: { name, slug, description: description ?? "", suggestedPrice, image, category: category ?? "Geral", rarity: rarity ?? "Common" },
  })
  return NextResponse.json({ ...product, suggestedPrice: Number(product.suggestedPrice) })
}
