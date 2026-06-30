import { cookies } from "next/headers";
import { authCookieName, dashboardLinks, getUserByUsername } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const user = getUserByUsername(cookieStore.get(authCookieName)?.value);
  const visibleLinks = dashboardLinks
    .filter((item) => user && item.roles.includes(user.role))
    .map((item) =>
      user?.role === "sales" &&
      item.href === "/sales" &&
      user.salesmanName
        ? {
            ...item,
            href: `/sales/${encodeURIComponent(user.salesmanName)}`,
          }
        : item,
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-50">
      <section className="flex w-full max-w-md flex-col items-center">
        <h1 className="mb-10 text-center text-4xl font-bold">SDM Steel</h1>
        <p className="-mt-6 mb-8 text-center text-sm text-zinc-400">
          Signed in as <span className="font-bold text-zinc-100">{user?.name}</span>
        </p>
        <div className="flex w-full flex-col items-center gap-5">
          {visibleLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex h-16 w-full max-w-xs items-center justify-center rounded-md bg-cyan-400 px-6 text-center text-lg font-bold text-zinc-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
            >
              {item.label}
            </a>
          ))}
        </div>
        <form action="/api/sign-out" method="post" className="mt-8">
          <button
            className="rounded-md border border-zinc-700 px-4 py-2 font-semibold text-zinc-300 hover:bg-zinc-900"
            type="submit"
          >
            Sign Out
          </button>
        </form>
      </section>
    </main>
  );
}
