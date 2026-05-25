import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { orderId, tradeId, receiverId, rating, comment, type } = await req.json()

  if (!receiverId || !rating || !type || (!orderId && !tradeId)) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }
  if (rating < 1 || rating > 5) return NextResponse.json({ error: "Nota deve ser entre 1 e 5" }, { status: 400 })
  if (receiverId === session.user.id) return NextResponse.json({ error: "Não é possível avaliar a si mesmo" }, { status: 400 })

  const review = await prisma.review.create({
    data: {
      giverId: session.user.id,
      receiverId,
      orderId: orderId ?? null,
      tradeId: tradeId ?? null,
      rating,
      comment: comment?.trim() || null,
      type,
    },
  })

  return NextResponse.json(review)
}
