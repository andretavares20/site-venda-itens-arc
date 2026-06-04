import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { dataUrl } = await req.json()
  if (!dataUrl || !dataUrl.startsWith("data:image/"))
    return NextResponse.json({ error: "Imagem inválida" }, { status: 400 })

  // ~2MB limit on the base64 string
  if (dataUrl.length > 2_800_000)
    return NextResponse.json({ error: "Imagem muito grande (máx. 2MB)" }, { status: 400 })

  await (prisma as any).user.update({
    where: { id: session.user.id },
    data: { avatarUrl: dataUrl },
  })

  return NextResponse.json({ url: dataUrl })
}
