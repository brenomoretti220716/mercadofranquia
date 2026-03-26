import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "mercadofranquia-dev-secret-change-in-prod" })

  if (!token) {
    const loginUrl = new URL("/admin/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
