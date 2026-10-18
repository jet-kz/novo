import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rider pages anyone may open without signing in.
const RIDER_PUBLIC = new Set(["/rider/login", "/rider/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value || request.cookies.get("token")?.value;

  if (pathname.startsWith("/admin")) {
    const userRole = request.cookies.get("novo_role")?.value;
    const isAdmin = userRole === "admin" || userRole === "super_admin";

    if (!token || !isAdmin) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if ((pathname === "/rider" || pathname.startsWith("/rider/")) && !RIDER_PUBLIC.has(pathname) && !token) {
    const loginUrl = new URL("/rider/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/rider", "/rider/:path*"],
};
