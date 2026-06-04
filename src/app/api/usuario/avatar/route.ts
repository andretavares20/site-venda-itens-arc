import { put } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 })

  if (file.size > 2 * 1024 * 1024)
    return NextResponse.json({ error: "Imagem muito grande (máx. 2MB)" }, { status: 400 })

  const blob = await put(`avatars/${session.user.id}`, file, {
    access: "public",
    addRandomSuffix: false,
  })

  await (prisma as any).user.update({
    where: { id: session.user.id },
    data: { avatarUrl: blob.url },
  })

  return NextResponse.json({ url: blob.url })
}
