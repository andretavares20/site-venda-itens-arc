import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createHmac } from "crypto"
import { decrementStockForOrder } from "@/lib/decrement-stock"
import { notifyAdmins } from "@/lib/notify-admins"
import { sendDiscordDM, sendAdminAlert, dmPedidoPago, dmPagamentoConfirmado, embedPedidoPago, createPrivateChannel, embedCanalPedido } from "@/lib/discord"

function validateSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true

  const xSignature = req.headers.get("x-signature")
  const xRequestId = req.headers.get("x-request-id")
  if (!xSignature || !xRequestId) return false

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  )
  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  let dataId = ""
  try { dataId = JSON.parse(rawBody)?.data?.id ?? "" } catch {}

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac("sha256", secret).update(template).digest("hex")
  return expected === v1
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!validateSignature(req, rawBody)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
  }

  let body: { type?: string; data?: { id?: string } }
  try { body = JSON.parse(rawBody) } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (body.type === "payment" && body.data?.id) {
    const paymentId = String(body.data.id)

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })
    if (!mpRes.ok) return NextResponse.json({ error: "Erro ao consultar pagamento" }, { status: 500 })
    const mpPayment = await mpRes.json()
    if (mpPayment.status !== "approved") return NextResponse.json({ ok: true })

    const order = await prisma.order.findFirst({
      where: { paymentId },
      include: {
        items: { select: { stockId: true, quantity: true } },
        encomendaProposal: { select: { encomendaId: true } },
      },
    })

    if (order?.status === "PENDENTE") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAGO" } })

      const stockItems = order.items.filter((i) => i.stockId)
      if (stockItems.length > 0) await decrementStockForOrder(stockItems)

      const orderId = order.id.slice(-8).toUpperCase()
      const isEncomenda = !!order.encomendaProposal?.encomendaId

      // Notificação in-app para admins
      if (isEncomenda) {
        await prisma.encomenda.update({
          where: { id: order.encomendaProposal!.encomendaId },
          data: { status: "PAGA" },
        })
        await notifyAdmins(
          "ORDER_PAID",
          `Encomenda paga — #${orderId}`,
          "O comprador pagou. Vendedor e comprador combinam a entrega diretamente.",
          "/admin/pedidos",
        )
      } else {
        await notifyAdmins(
          "ORDER_PAID",
          `Pedido pago — #${orderId}`,
          "Novo pagamento confirmado. Vendedor e comprador combinam a entrega in-game.",
          "/admin/pedidos",
        )
      }

      // Busca dados completos para notificações
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          buyer: { select: { id: true, name: true, discordId: true } },
          items: {
            include: {
              stock: {
                include: {
                  seller: { select: { id: true, name: true, discordId: true } },
                  product: { select: { name: true } },
                },
              },
            },
          },
        },
      })

      if (fullOrder) {
        const firstItem = fullOrder.items[0]?.stock
        const seller = firstItem?.seller
        const itemName = firstItem?.product.name ?? "item"
        const orderLink = `/pedido/${order.id}`

        // Notificação in-app para o comprador
        await prisma.notification.create({
          data: {
            userId: fullOrder.buyer.id,
            type: "ORDER_PAID",
            title: "Pagamento confirmado!",
            body: `Seu pagamento foi confirmado. Aguarde o vendedor entrar em contato para combinar a entrega do ${itemName} in-game.`,
            link: orderLink,
          },
        })

        // Notificação in-app para o vendedor
        if (seller?.id) {
          await prisma.notification.create({
            data: {
              userId: seller.id,
              type: "ORDER_SOLD",
              title: "Seu item foi vendido!",
              body: `${itemName} foi vendido. Entre em contato com o comprador para combinar a entrega in-game.`,
              link: `/minha-conta/vendas`,
            },
          })
        }

        // Discord DM para comprador e vendedor
        if (fullOrder.buyer.discordId) {
          sendDiscordDM(fullOrder.buyer.discordId, dmPagamentoConfirmado(fullOrder.buyer.name ?? "Comprador", itemName)).catch(() => {})
        }
        if (seller?.discordId) {
          sendDiscordDM(seller.discordId, dmPedidoPago(seller.name ?? "Vendedor", itemName)).catch(() => {})
        }

        sendAdminAlert(embedPedidoPago({
          buyerName: fullOrder.buyer.name ?? "Comprador",
          sellerName: seller?.name ?? "Vendedor",
          sellerDiscord: seller?.discordId ?? null,
          itemName,
          total: Number(fullOrder.total),
        })).catch(() => {})

        // Cria canal privado temporário no Discord
        const channelName = `entrega-${orderId.toLowerCase()}`
        const memberIds = [fullOrder.buyer.discordId, seller?.discordId].filter(Boolean) as string[]
        createPrivateChannel({
          name: channelName,
          topic: `Pedido #${orderId} · ${fullOrder.buyer.name} ↔ ${seller?.name ?? "Vendedor"}`,
          memberDiscordIds: memberIds,
          introEmbed: embedCanalPedido({
            orderId,
            buyerName:    fullOrder.buyer.name ?? "Comprador",
            buyerDiscord: fullOrder.buyer.discordId,
            sellerName:   seller?.name ?? "Vendedor",
            sellerDiscord: seller?.discordId ?? null,
            items: fullOrder.items.map((i) => ({ name: i.stock?.product.name ?? "item", quantity: i.quantity })),
          }),
        }).then((channelId) => {
          if (channelId) prisma.order.update({ where: { id: order.id }, data: { discordChannelId: channelId } }).catch(() => {})
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
