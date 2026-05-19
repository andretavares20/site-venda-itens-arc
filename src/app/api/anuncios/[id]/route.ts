import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, pixKey: true } },
      items: { include: { product: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { status, adminNotes } = body

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isAdmin = session.user.role === "ADMIN"
  const isOwner = listing.sellerId === session.user.id

  // Vendedor só pode cancelar se não tiver comprador ainda
  if (!isAdmin) {
    if (!isOwner) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (status !== "CANCELADO") return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    const hasOrders = await prisma.orderItem.findFirst({
      where: { listingItem: { listingId: id } },
    })
    if (hasOrders) return NextResponse.json({ error: "Anúncio já possui compra — não pode cancelar" }, { status: 400 })
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { status, ...(adminNotes !== undefined && { adminNotes }) },
    include: { items: { include: { product: true } } },
  })

  return NextResponse.json(updated)
}
