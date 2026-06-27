import DashboardLogoLink from "../../components/DashboardLogoLink";
import FinishedGoodsTable from "./FinishedGoodsTable";

export default function FinishedGoodsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto max-w-5xl">
        <DashboardLogoLink />
        <h1 className="mt-8 text-4xl font-bold">Finished Goods / FG</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Finished goods inventory will show slit material ready for shipment.
        </p>

        <FinishedGoodsTable />
      </section>
    </main>
  );
}
