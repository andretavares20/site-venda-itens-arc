import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { id } = await params

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { sellerId: true, status: true },
  })

  if (!listing) return NextResponse.json({ error: "Anúncio não encontrado" }, { status: 404 })
  if (listing.sellerId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  // Cancelamento gratuito e imediato — item ainda não foi entregue à administração
  if (listing.status === "PENDENTE_ENTREGA") {
    await prisma.listing.update({ where: { id }, data: { status: "CANCELADO" } })
    return NextResponse.json({ type: "imediato" })
  }

  // Item já está com a administração — precisa contato via Discord para devolução
  if (listing.status === "DISPONIVEL") {
    await prisma.listing.update({ where: { id }, data: { status: "CANCELAMENTO_SOLICITADO" } })
    // Desativa o stock para sair da loja (mas mantém no banco para admin ver)
    await prisma.stock.updateMany({
      where: { listingId: id },
      data: { active: false },
    })
    return NextResponse.json({ type: "discord" })
  }

  return NextResponse.json({ error: "Este anúncio não pode ser cancelado" }, { status: 400 })
}
