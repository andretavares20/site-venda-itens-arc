import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createHmac } from "crypto"
import { decrementStockForOrder } from "@/lib/decrement-stock"
import { notifyAdmins } from "@/lib/notify-admins"
import { sendDiscordDM, sendAdminAlert, dmPedidoPago, dmPagamentoConfirmado, embedPedidoPago } from "@/lib/discord"

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
          "O comprador pagou. Retire o item com o vendedor e entregue no Discord.",
          "/admin/pedidos",
        )
      } else {
        await notifyAdmins(
          "ORDER_PAID",
          `Pedido pago — #${orderId}`,
          "Novo pagamento confirmado. Entregue o item ao comprador no Discord.",
          "/admin/pedidos",
        )
      }

      // Notificações Discord (DM vendedor + alerta canal admin)
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          buyer: { select: { name: true, discordId: true } },
          items: {
            include: {
              stock: {
                include: {
                  seller: { select: { name: true, discordId: true } },
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
      }
    }
  }

  return NextResponse.json({ ok: true })
}
