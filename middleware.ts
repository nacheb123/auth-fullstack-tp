import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifyToken(req.cookies.get("session")?.value);
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isPrivate =
    pathname.startsWith("/dashboard") || pathname.startsWith("/students");

  if (isPrivate && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/students/:path*", "/login", "/register"],
};
