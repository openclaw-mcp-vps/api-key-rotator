import { NextResponse, type NextRequest } from "next/server";
import { PAYWALL_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest): NextResponse {
  const hasPaidAccess = request.cookies.get(PAYWALL_COOKIE_NAME)?.value === "1";

  if (!hasPaidAccess) {
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("paywall", "locked");
      return NextResponse.redirect(url);
    }

    if (
      request.nextUrl.pathname.startsWith("/api/projects") ||
      request.nextUrl.pathname.startsWith("/api/keys")
    ) {
      return NextResponse.json({ message: "Paid access required" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/projects/:path*", "/api/keys/:path*"]
};
