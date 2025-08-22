import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/register", "/"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. If logged in user tries to access login/register → redirect to dashboard
  if (
    token &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(
      new URL(`/dashboard/${token.role.toLowerCase()}`, req.url)
    );
  }

  // 2. If not logged in and trying to access protected route → redirect to login
  if (!token && !publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Role-based protections
  if (token) {
    if (pathname.startsWith("/dashboard/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(`/dashboard/${token.role.toLowerCase()}`, req.url)
      );
    }
    if (pathname.startsWith("/dashboard/agent") && token.role !== "AGENT") {
      return NextResponse.redirect(
        new URL(`/dashboard/${token.role.toLowerCase()}`, req.url)
      );
    }
    if (
      pathname.startsWith("/dashboard/customer") &&
      token.role !== "CUSTOMER"
    ) {
      return NextResponse.redirect(
        new URL(`/dashboard/${token.role.toLowerCase()}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

// Apply to all routes
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
