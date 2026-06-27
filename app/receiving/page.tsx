import { prisma } from "@/lib/prisma";
import DashboardLogoLink from "../components/DashboardLogoLink";
import { getNextCoilNumber } from "./coilNumbers";
import ReceivingForm from "./ReceivingForm";

export const dynamic = "force-dynamic";

export default async function ReceivingPage() {
  const [nextCoilNumber, customers] = await Promise.all([
    getNextCoilNumber(),
    prisma.customer.findMany({
      orderBy: {
        customerNumber: "asc",
      },
      select: {
        customerNumber: true,
        name: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto max-w-5xl">
        <DashboardLogoLink />
        <h1 className="mt-8 text-4xl font-bold">Receiving</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Add new master coils to inventory.
        </p>

        <ReceivingForm customers={customers} nextCoilNumber={nextCoilNumber} />
      </section>
    </main>
  );
}
