import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")

  if (slug) {
    const product = await prisma.product.findUnique({ where: { slug } })
    if (!product) return NextResponse.json(null, { status: 404 })
    return NextResponse.json({ ...product, price: Number(product.price) })
  }

  const category = searchParams.get("categoria") ?? undefined
  const products = await prisma.product.findMany({
    where: { active: true, ...(category ? { category } : {}) },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(products.map((p: { price: unknown } & object) => ({ ...p, price: Number(p.price) })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { name, slug, description, price, image, stock, category } = body

  if (!name || !slug || !price || !image) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: { name, slug, description: description ?? "", price, image, stock: stock ?? 0, category: category ?? "Geral" },
  })
  return NextResponse.json({ ...product, price: Number(product.price) })
}
