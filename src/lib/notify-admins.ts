import { prisma } from "@/lib/db"

export async function notifyAdmins(
  type: string,
  title: string,
  body: string,
  link: string,
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  })

  if (admins.length === 0) return

  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type, title, body, link })),
  })
}
