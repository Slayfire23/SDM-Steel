import { prisma } from "@/lib/prisma";
import DashboardLogoLink from "../components/DashboardLogoLink";
import ScheduleBoard from "./ScheduleBoard";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const scheduledSetups = await prisma.scheduledSetup.findMany({
    orderBy: {
      submittedAt: "desc",
    },
  });
  const setupRows = scheduledSetups.map((setup) => ({
    setupNumber: setup.setupNumber,
    dateApplied: setup.dateApplied,
    applier: setup.applier ?? "",
    machine: setup.machine,
    gauge: setup.gauge ?? "",
    finish: setup.finish ?? "",
    status: setup.status,
    submittedAt: setup.submittedAt.toISOString(),
    coils: setup.coils as {
      coilNumber: string;
      width: string;
      weight: string;
      cutWidth: string;
      breaks: string;
      calcOd: string;
    }[],
    salesMemos: setup.salesMemos as {
      memoNumber: string;
      customer: string;
      width: string;
    }[],
  }));

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto max-w-5xl">
        <DashboardLogoLink />
        <h1 className="mt-8 text-4xl font-bold">Slitting Schedule</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          This page will track scheduled jobs, machine assignment, priority,
          status, and due dates.
        </p>
        <ScheduleBoard initialSetups={setupRows} />
      </section>
    </main>
  );
}
