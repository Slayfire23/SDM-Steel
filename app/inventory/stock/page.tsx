import { prisma } from "@/lib/prisma";
import DashboardLogoLink from "../../components/DashboardLogoLink";
import InventoryTable from "../InventoryTable";

export const dynamic = "force-dynamic";

export default async function StockInventoryPage() {
  const coils = await prisma.masterCoil.findMany({
    where: {
      status: {
        not: "Slit",
      },
    },
    orderBy: {
      coilNumber: "asc",
    },
  });

  const inventoryCoils = coils.map((coil) => ({
    id: coil.id.toString(),
    coilNumber: coil.coilNumber,
    grade: coil.grade,
    width: coil.width.toString(),
    weight: coil.weight,
    status: coil.status,
    reservedCustomer: coil.reservedCustomer,
    location: coil.location,
    gauge: coil.gauge?.toString() ?? null,
    rockwell: coil.rockwell?.toString() ?? null,
    finish: coil.finish,
    supplier: coil.supplier,
  }));

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto max-w-5xl">
        <DashboardLogoLink />
        <h1 className="mt-8 text-4xl font-bold">Stock Inventory</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Master coils received into inventory.
        </p>

        <InventoryTable coils={inventoryCoils} />
      </section>
    </main>
  );
}
