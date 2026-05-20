import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generatePixPayload } from "@/lib/pix-payload"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { pixKey, amount, name } = await req.json()
  if (!pixKey || !amount || !name) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  const payload = generatePixPayload({ pixKey, amount, name })
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=10&data=${encodeURIComponent(payload)}`

  return NextResponse.json({ qrCode: qrUrl, payload })
}
