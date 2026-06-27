import { prisma } from "@/lib/prisma";
import DashboardLogoLink from "../../components/DashboardLogoLink";
import { getNextCustomerNumber } from "../customerNumbers";
import SalesmanSwitcher from "../SalesmanSwitcher";
import AddCustomerModal from "./AddCustomerModal";
import CustomerSelector from "./CustomerSelector";

export const dynamic = "force-dynamic";

type SalesmanPageProps = {
  params: Promise<{
    salesman: string;
  }>;
  searchParams?: Promise<{
    customerId?: string;
  }>;
};

type ScheduledMemo = {
  memoNumber?: string;
};

function getSalesMemoStatus(
  memoNumber: string,
  baseStatus: string,
  scheduledMemoStatuses: Map<string, string>,
) {
  return scheduledMemoStatuses.get(memoNumber) ?? baseStatus;
}

function displayMemoStatus(status: string) {
  if (status === "Ready to schedule") {
    return "Scheduled";
  }

  return status;
}

export default async function SalesmanPage({
  params,
  searchParams,
}: SalesmanPageProps) {
  const { salesman: encodedSalesman } = await params;
  const query = searchParams ? await searchParams : {};
  const salesman = decodeURIComponent(encodedSalesman);

  const [nextCustomerNumber, salesmen, customers, scheduledSetups] = await Promise.all([
    getNextCustomerNumber(),
    prisma.salesman.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        name: true,
      },
    }),
    prisma.customer.findMany({
      orderBy: {
        customerNumber: "asc",
      },
      where: {
        salesman,
      },
      include: {
        salesMemos: {
          orderBy: {
            memoNumber: "asc",
          },
        },
      },
    }),
    prisma.scheduledSetup.findMany({
      select: {
        status: true,
        salesMemos: true,
      },
    }),
  ]);
  const scheduledMemoStatuses = new Map<string, string>();

  for (const setup of scheduledSetups) {
    const setupMemos = Array.isArray(setup.salesMemos)
      ? (setup.salesMemos as ScheduledMemo[])
      : [];

    for (const memo of setupMemos) {
      if (memo.memoNumber) {
        scheduledMemoStatuses.set(memo.memoNumber, setup.status);
      }
    }
  }

  const selectedCustomer =
    customers.find((customer) => customer.id === query.customerId) ?? null;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="mx-auto max-w-5xl">
        <DashboardLogoLink />
        <SalesmanSwitcher
          currentSalesman={salesman}
          salesmen={salesmen.map((salesmanRecord) => salesmanRecord.name)}
        />
        <h1 className="mt-8 text-4xl font-bold">Sales: {salesman}</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Create and view customers for this salesman.
        </p>

        <AddCustomerModal
          nextCustomerNumber={nextCustomerNumber}
          salesman={salesman}
        />

        <CustomerSelector
          customers={customers.map((customer) => ({
            customerNumber: customer.customerNumber,
            id: customer.id,
            name: customer.name,
          }))}
          salesman={salesman}
          selectedCustomerId={query.customerId ?? ""}
        />

        {selectedCustomer ? (
          <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="grid gap-y-5 gap-x-12 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-zinc-400">Customer Number</p>
                <p className="mt-1 font-bold text-cyan-300">
                  {selectedCustomer.customerNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Customer</p>
                <p className="mt-1 font-semibold">{selectedCustomer.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Contact</p>
                <p className="mt-1 font-semibold">
                  {selectedCustomer.contactName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Status</p>
                <p className="mt-1 font-semibold">{selectedCustomer.status}</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-zinc-400">Email</p>
                <p className="mt-1 break-words font-semibold">
                  {selectedCustomer.email ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Phone</p>
                <p className="mt-1 font-semibold">
                  {selectedCustomer.phone ?? "-"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-zinc-400">Address</p>
                <p className="mt-1 font-semibold">
                  {selectedCustomer.address ?? "-"}
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto border-t border-zinc-800 pt-5">
              <h2 className="text-xl font-bold">Customer Sales Memos</h2>
              <table className="mt-4 w-full min-w-[850px] border-collapse text-left text-sm">
                <thead className="text-zinc-300">
                  <tr>
                    <th className="py-2 pr-4">Memo</th>
                    <th className="py-2 pr-4">Grade</th>
                    <th className="py-2 pr-4">Finish</th>
                    <th className="py-2 pr-4">Gauge</th>
                    <th className="py-2 pr-4">Width</th>
                    <th className="py-2 pr-4">Weight</th>
                    <th className="py-2 pr-4">Due</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {selectedCustomer.salesMemos.map((memo) => (
                    <tr key={memo.id}>
                      <td className="py-2 pr-4 font-semibold">
                        {memo.memoNumber}
                      </td>
                      <td className="py-2 pr-4">{memo.grade}</td>
                      <td className="py-2 pr-4">{memo.finish}</td>
                      <td className="py-2 pr-4">
                        {memo.gauge?.toString() ?? "-"}
                      </td>
                      <td className="py-2 pr-4">{memo.width.toString()}</td>
                      <td className="py-2 pr-4">
                        {memo.weight.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">
                        {memo.dueDate ? memo.dueDate.toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="rounded bg-cyan-300 px-2 py-1 text-xs font-bold text-zinc-950">
                          {displayMemoStatus(
                            getSalesMemoStatus(
                              memo.memoNumber,
                              memo.status,
                              scheduledMemoStatuses,
                            ),
                          )}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{memo.notes ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedCustomer.salesMemos.length === 0 ? (
                <p className="py-4 text-sm text-zinc-400">
                  No sales memos yet.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="mt-10 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-300">
              <tr>
                <th className="px-4 py-3">Customer Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Sales Memos</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {customers.map((customer) => (
                <tr key={customer.id} className="bg-zinc-950">
                  <td className="px-4 py-3 font-semibold">
                    {customer.customerNumber}
                  </td>
                  <td className="px-4 py-3">{customer.name}</td>
                  <td className="px-4 py-3">{customer.salesMemos.length}</td>
                  <td className="px-4 py-3">{customer.contactName ?? "-"}</td>
                  <td className="px-4 py-3">{customer.email ?? "-"}</td>
                  <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                  <td className="px-4 py-3">{customer.status}</td>
                  <td className="px-4 py-3">{customer.address ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers.length === 0 ? (
            <p className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
              No customers have been created for this salesman yet.
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-5">
          <h2 className="text-2xl font-bold">Sales Memos</h2>
          {customers.map((customer) => (
            <section
              key={`${customer.id}-memos`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5"
            >
              <h3 className="text-lg font-bold">
                {customer.customerNumber} - {customer.name}
              </h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                  <thead className="text-zinc-300">
                    <tr>
                      <th className="py-2 pr-4">Memo</th>
                      <th className="py-2 pr-4">Grade</th>
                      <th className="py-2 pr-4">Finish</th>
                      <th className="py-2 pr-4">Gauge</th>
                      <th className="py-2 pr-4">Width</th>
                      <th className="py-2 pr-4">Weight</th>
                      <th className="py-2 pr-4">Due</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {customer.salesMemos.map((memo) => (
                      <tr key={memo.id}>
                        <td className="py-2 pr-4 font-semibold">
                          {memo.memoNumber}
                        </td>
                        <td className="py-2 pr-4">{memo.grade}</td>
                        <td className="py-2 pr-4">{memo.finish}</td>
                        <td className="py-2 pr-4">
                          {memo.gauge?.toString() ?? "-"}
                        </td>
                        <td className="py-2 pr-4">{memo.width.toString()}</td>
                        <td className="py-2 pr-4">
                          {memo.weight.toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          {memo.dueDate
                            ? memo.dueDate.toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="py-2 pr-4">
                          <span className="rounded bg-cyan-300 px-2 py-1 text-xs font-bold text-zinc-950">
                            {displayMemoStatus(
                              getSalesMemoStatus(
                                memo.memoNumber,
                                memo.status,
                                scheduledMemoStatuses,
                              ),
                            )}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{memo.notes ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customer.salesMemos.length === 0 ? (
                  <p className="py-4 text-sm text-zinc-400">
                    No sales memos yet.
                  </p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
