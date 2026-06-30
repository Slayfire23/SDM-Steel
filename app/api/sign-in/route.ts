import { NextResponse } from "next/server";
import { appUsers, authCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = appUsers.find(
    (currentUser) =>
      currentUser.username === username && currentUser.password === password,
  );

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in?error=1", request.url));
  }

  const destination =
    user.role === "sales" && user.salesmanName
      ? `/sales/${encodeURIComponent(user.salesmanName)}`
      : "/";
  const response = NextResponse.redirect(new URL(destination, request.url));

  response.cookies.set(authCookieName, user.username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
