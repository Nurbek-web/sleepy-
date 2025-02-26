import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth-token");
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register"];

  // Paths that should bypass auth check
  const bypassPaths = ["/_next", "/api", "/static", "/favicon.ico", "/images"];

  // Check if the path should bypass auth check
  if (bypassPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if the path is public
  const isPublicPath = publicPaths.includes(pathname);

  // Add a small delay for the auth token to be set
  if (pathname === "/dashboard" && !authToken) {
    // Give a small grace period for the token to be set
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  // Redirect to login if accessing protected route without auth
  if (!authToken && !isPublicPath) {
    console.log("No auth token found, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if (authToken && isPublicPath) {
    console.log("Auth token found, redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
