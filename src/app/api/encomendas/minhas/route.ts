import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const encomendas = await prisma.encomenda.findMany({
    where: { buyerId: session.user.id },
    include: {
      product: { select: { name: true, image: true } },
      proposals: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(encomendas)
}
