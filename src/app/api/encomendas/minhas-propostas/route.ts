import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const proposals = await prisma.encomendaProposal.findMany({
    where: { sellerId: session.user.id },
    include: {
      encomenda: {
        include: { product: { select: { name: true, image: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(proposals)
}
