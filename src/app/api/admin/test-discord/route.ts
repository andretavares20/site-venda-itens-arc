import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createPrivateChannel, embedCanalPedido } from "@/lib/discord"

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const channelId = await createPrivateChannel({
    name: "teste-canal-pedido",
    topic: "Pedido #TESTE · Canal de teste criado pelo admin",
    memberDiscordIds: [], // só admin verá
    introEmbed: embedCanalPedido({
      orderId: "TESTE001",
      buyerName: "Comprador Teste",
      buyerDiscord: null,
      sellerName: "Vendedor Teste",
      sellerDiscord: null,
      items: [{ name: "Item de Teste", quantity: 1 }],
    }),
  })

  if (!channelId) {
    return NextResponse.json({ ok: false, error: "Falhou ao criar canal — veja os Runtime Logs" })
  }

  return NextResponse.json({ ok: true, channelId })
}
