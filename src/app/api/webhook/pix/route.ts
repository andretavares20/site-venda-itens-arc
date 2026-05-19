import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createHmac } from "crypto"

function validateSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // se não configurado, ignora validação

  const xSignature = req.headers.get("x-signature")
  const xRequestId = req.headers.get("x-request-id")

  if (!xSignature || !xRequestId) return false

  // Extrai ts e v1 do header x-signature
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  )
  const ts = parts["ts"]
  const v1 = parts["v1"]

  if (!ts || !v1) return false

  // Monta o template assinado conforme documentação do Mercado Pago
  let dataId = ""
  try {
    const body = JSON.parse(rawBody)
    dataId = body?.data?.id ?? ""
  } catch {}

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const expected = createHmac("sha256", secret)
    .update(template)
    .digest("hex")

  return expected === v1
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!validateSignature(req, rawBody)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 })
  }

  let body: { type?: string; data?: { id?: string } }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  if (body.type === "payment" && body.data?.id) {
    const paymentId = String(body.data.id)

    // Pagamento de pedido
    const order = await prisma.order.findFirst({ where: { paymentId } })
    if (order?.status === "PENDENTE") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "PAGO" } })
      return NextResponse.json({ ok: true })
    }

    // Taxa de cancelamento de anúncio
    const listings = await prisma.listing.findMany({
      where: { status: "CANCELAMENTO_SOLICITADO" as never },
    })

    for (const listing of listings) {
      try {
        const notes = JSON.parse(listing.adminNotes ?? "{}")
        if (notes.cancelPaymentId === paymentId) {
          await prisma.listing.update({
            where: { id: listing.id },
            data: {
              status: "CANCELADO" as never,
              adminNotes: JSON.stringify({ ...notes, feePaid: true }),
            },
          })
          break
        }
      } catch {}
    }
  }

  return NextResponse.json({ ok: true })
}
