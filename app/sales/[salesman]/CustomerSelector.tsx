"use client";

import { useRouter } from "next/navigation";

type CustomerOption = {
  customerNumber: string;
  id: string;
  name: string | null;
};

type CustomerSelectorProps = {
  customers: CustomerOption[];
  salesman: string;
  selectedCustomerId: string;
};

const inputClass =
  "mt-2 h-12 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-cyan-300";

export default function CustomerSelector({
  customers,
  salesman,
  selectedCustomerId,
}: CustomerSelectorProps) {
  const router = useRouter();

  return (
    <label className="mt-6 flex max-w-xl flex-col text-sm font-semibold text-zinc-200">
      View Customer Details
      <select
        className={inputClass}
        value={selectedCustomerId}
        onChange={(event) => {
          const customerId = event.target.value;
          const basePath = `/sales/${encodeURIComponent(salesman)}`;

          router.push(
            customerId
              ? `${basePath}?customerId=${encodeURIComponent(customerId)}`
              : basePath,
          );
        }}
      >
        <option value="">Select a customer</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.customerNumber}
            {customer.name ? ` - ${customer.name}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
