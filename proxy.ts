import { NextRequest, NextResponse } from "next/server";
import { authCookieName, canAccessPath, getUserByUsername } from "@/lib/auth";

const publicPrefixes = ["/sign-in", "/_next", "/favicon.ico"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (publicPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  const user = getUserByUsername(request.cookies.get(authCookieName)?.value);

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (
    user.role === "sales" &&
    user.salesmanName &&
    (path === "/sales" || path === "/sales/")
  ) {
    return NextResponse.redirect(
      new URL(`/sales/${encodeURIComponent(user.salesmanName)}`, request.url),
    );
  }

  if (
    user.role === "sales" &&
    user.salesmanName &&
    path.startsWith("/sales/") &&
    !path.startsWith(`/sales/${encodeURIComponent(user.salesmanName)}`)
  ) {
    return NextResponse.redirect(
      new URL(`/sales/${encodeURIComponent(user.salesmanName)}`, request.url),
    );
  }

  if (!canAccessPath(user, path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
