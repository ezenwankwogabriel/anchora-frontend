import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes the unauthenticated user is allowed to visit
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/mfa-setup",
  "/auth/callback",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const adminAuth = request.cookies.get("anchora_admin_auth");
    if (!adminAuth) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── Release routes — guarded by useReleaseAuth hook, not middleware ─────────
  if (pathname.startsWith("/release/")) return NextResponse.next();

  // ── Public routes ───────────────────────────────────────────────────────────
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // ── All other routes require user auth ──────────────────────────────────────
  const auth = request.cookies.get("anchora_auth");
  if (!auth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals, static files, and the API proxy
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|images/).*)"],
};
