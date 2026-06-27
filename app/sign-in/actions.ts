"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appUsers, authCookieName } from "@/lib/auth";

export async function signIn(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = appUsers.find(
    (currentUser) =>
      currentUser.username === username && currentUser.password === password,
  );

  if (!user) {
    redirect("/sign-in?error=1");
  }

  const cookieStore = await cookies();

  cookieStore.set(authCookieName, user.username, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  if (user.role === "sales" && user.salesmanName) {
    redirect(`/sales/${encodeURIComponent(user.salesmanName)}`);
  }

  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();

  cookieStore.delete(authCookieName);
  redirect("/sign-in");
}
