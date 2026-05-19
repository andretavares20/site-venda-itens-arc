import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Chamada pelo Vercel Cron Jobs a cada hora
// Vercel cron config em vercel.json
export async function GET() {
  const now = new Date()

  // Busca trocas aguardando confirmação com prazo expirado e sem reclamação
  const expired = await prisma.trade.findMany({
    where: {
      status: "AGUARDANDO_CONFIRMACAO",
      expiresAt: { lte: now },
    },
    include: {
      proposals: { where: { status: "ACEITA" } },
    },
  })

  let concluded = 0

  for (const trade of expired) {
    const proposal = trade.proposals[0]
    if (!proposal) continue

    await prisma.$transaction([
      prisma.tradeProposal.update({
        where: { id: proposal.id },
        data: { status: "CONCLUIDA" },
      }),
      prisma.trade.update({
        where: { id: trade.id },
        data: { status: "CONCLUIDA" },
      }),
    ])

    concluded++
  }

  return NextResponse.json({ concluded, checked: expired.length })
}
