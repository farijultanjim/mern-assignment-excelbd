import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface CustomJWT {
  role?: "ADMIN" | "AGENT" | "CUSTOMER";
  email?: string;
  name?: string;
}

const publicRoutes = ["/login", "/register", "/"];

export async function middleware(req: NextRequest) {
  const token = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as CustomJWT | null;
  const { pathname } = req.nextUrl;

  // 1. Already logged in trying to access /login or /register
  if (
    token &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(
      new URL(`/dashboard/${token.role?.toLowerCase()}`, req.url)
    );
  }

  // 2. Not logged in → redirect to /login
  if (!token && !publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Role-based protections
  if (token?.role) {
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

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
