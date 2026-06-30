import { NextResponse } from "next/server";
import { authCookieName } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/sign-in", request.url));

  response.cookies.delete(authCookieName);

  return response;
}
