import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  if (pathname.startsWith("/admin") && (!isLoggedIn || req.auth?.user.role !== "ADMIN")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (pathname.startsWith("/checkout") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/pedido/:path*"],
}
