import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { orderId, receiverId, rating, comment, type } = await req.json()

  if (!orderId || !receiverId || !rating || !type) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Nota deve ser entre 1 e 5" }, { status: 400 })
  }

  const existing = await prisma.review.findFirst({
    where: { orderId, giverId: session.user.id, type },
  })
  if (existing) return NextResponse.json({ error: "Você já avaliou este pedido" }, { status: 409 })

  const review = await prisma.review.create({
    data: {
      giverId: session.user.id,
      receiverId,
      orderId,
      rating,
      comment: comment ?? null,
      type,
    },
  })

  return NextResponse.json(review)
}
