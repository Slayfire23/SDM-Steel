import DashboardLogoLink from "../components/DashboardLogoLink";

const inventoryLinks = [
  { href: "/inventory/stock", label: "Stock" },
  { href: "/inventory/finished-goods", label: "Finished Goods / FG" },
];

export default function InventoryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="flex w-full max-w-md flex-col items-center">
        <DashboardLogoLink />
        <h1 className="mt-8 mb-10 text-center text-4xl font-bold">
          Inventory
        </h1>
        <div className="flex w-full flex-col items-center gap-5">
          {inventoryLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex h-16 w-full max-w-xs items-center justify-center rounded-md bg-cyan-400 px-6 text-center text-lg font-bold text-zinc-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
