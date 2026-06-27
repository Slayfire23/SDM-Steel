import { prisma } from "@/lib/prisma";
import DashboardLogoLink from "../components/DashboardLogoLink";
import { getNextSetupNumber } from "./actions";
import SetupSheet from "./SetupSheet";

export const dynamic = "force-dynamic";

type SetupPageProps = {
  searchParams?: Promise<{
    setupNumber?: string;
  }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const query = searchParams ? await searchParams : {};
  const [salesMemos, stockCoils, nextSetupNumber] = await Promise.all([
    prisma.salesMemo.findMany({
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          memoNumber: "asc",
        },
      ],
      include: {
        customer: true,
      },
    }),
    prisma.masterCoil.findMany({
      orderBy: {
        coilNumber: "asc",
      },
      select: {
        coilNumber: true,
        finish: true,
        gauge: true,
        weight: true,
        width: true,
      },
    }),
    getNextSetupNumber(),
  ]);

  const setupSalesMemos = salesMemos.map((memo) => ({
    id: memo.id,
    memoNumber: memo.memoNumber,
    customer: `${memo.customer.customerNumber} - ${memo.customer.name ?? ""}`,
    salesman: memo.salesman,
    grade: memo.grade,
    finish: memo.finish,
    gauge: memo.gauge?.toString() ?? "",
    width: memo.width.toString(),
    weight: memo.weight,
    dueDate: memo.dueDate ? memo.dueDate.toLocaleDateString() : "",
    status: memo.status,
    notes: memo.notes ?? "",
  }));

  const setupStockCoils = stockCoils.map((coil) => ({
    coilNumber: coil.coilNumber,
    finish: coil.finish ?? "",
    gauge: coil.gauge?.toString() ?? "",
    weight: coil.weight,
    width: coil.width.toString(),
  }));

  return (
    <main className="min-h-screen bg-zinc-950 px-3 py-8 text-zinc-50 sm:px-4">
      <section className="w-full">
        <DashboardLogoLink />
        <h1 className="mt-8 text-4xl font-bold">Create Set-Up</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Review sales memos and use the customer specs to create slitting
          set-ups.
        </p>

        <SetupSheet
          salesMemos={setupSalesMemos}
          setupNumber={query.setupNumber ?? nextSetupNumber}
          stockCoils={setupStockCoils}
        />
      </section>
    </main>
  );
}
