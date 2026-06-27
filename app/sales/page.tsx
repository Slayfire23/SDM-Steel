import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, getUserByUsername } from "@/lib/auth";
import DashboardLogoLink from "../components/DashboardLogoLink";
import SalesmanPicker from "./SalesmanPicker";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const cookieStore = await cookies();
  const user = getUserByUsername(cookieStore.get(authCookieName)?.value);

  if (user?.role === "sales" && user.salesmanName) {
    redirect(`/sales/${encodeURIComponent(user.salesmanName)}`);
  }

  const salesmen = await prisma.salesman.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      name: true,
    },
  });

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto max-w-3xl">
        <DashboardLogoLink />
        <h1 className="mt-8 text-4xl font-bold">Sales</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Select a salesman before creating or viewing customers.
        </p>

        <SalesmanPicker
          salesmen={salesmen.map((salesman) => salesman.name)}
        />
      </section>
    </main>
  );
}
