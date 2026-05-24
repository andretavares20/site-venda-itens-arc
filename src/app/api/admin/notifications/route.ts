import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const listings = await prisma.listing.findMany({
    where: { status: "PENDENTE_ENTREGA" },
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  })

  return NextResponse.json({ unreadCount: listings.length, listings })
}
