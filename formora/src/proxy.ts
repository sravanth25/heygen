import { NextResponse, type NextRequest } from "next/server";

/**
 * First line of defence for /admin: bounce requests without a session cookie.
 * The cookie's signature and expiry are verified server-side by
 * requireAdmin() in every admin page and action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !request.cookies.has("formora_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const res = NextResponse.next();
  if (pathname.startsWith("/admin") || pathname.startsWith("/orders") || pathname.startsWith("/checkout")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Referrer-Policy", "no-referrer");
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/orders/:path*", "/checkout/:path*"],
};
