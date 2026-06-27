"use client";

import { useMemo, useState } from "react";

type InventoryCoil = {
  id: string;
  coilNumber: string;
  grade: string;
  width: string;
  weight: number;
  status: string;
  reservedCustomer: string | null;
  location: string | null;
  gauge: string | null;
  rockwell: string | null;
  finish: string | null;
  supplier: string | null;
};

type FilterKey = Exclude<keyof InventoryCoil, "id" | "coilNumber">;

const filterOptions: { label: string; value: FilterKey }[] = [
  { label: "Grade", value: "grade" },
  { label: "Width", value: "width" },
  { label: "Weight", value: "weight" },
  { label: "Status", value: "status" },
  { label: "Reserved Customer", value: "reservedCustomer" },
  { label: "Location", value: "location" },
  { label: "Gauge", value: "gauge" },
  { label: "Rockwell", value: "rockwell" },
  { label: "Finish", value: "finish" },
  { label: "Supplier", value: "supplier" },
];

type InventoryTableProps = {
  coils: InventoryCoil[];
};

export default function InventoryTable({ coils }: InventoryTableProps) {
  const [filterKey, setFilterKey] = useState<FilterKey>("grade");
  const [filterValue, setFilterValue] = useState("");

  const filteredCoils = useMemo(() => {
    const searchValue = filterValue.trim().toLowerCase();

    if (!searchValue) {
      return coils;
    }

    return coils.filter((coil) => {
      const value = coil[filterKey];

      return String(value ?? "").toLowerCase().includes(searchValue);
    });
  }, [coils, filterKey, filterValue]);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-end">
        <label className="grid gap-2 text-sm text-zinc-300">
          Filter By
          <select
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
            value={filterKey}
            onChange={(event) => setFilterKey(event.target.value as FilterKey)}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid flex-1 gap-2 text-sm text-zinc-300">
          Search
          <input
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            placeholder={`Search ${filterOptions.find((option) => option.value === filterKey)?.label.toLowerCase()}`}
            type="text"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
          />
        </label>

        <p className="text-sm text-zinc-400">
          Showing {filteredCoils.length} of {coils.length}
        </p>
      </div>

      <div className="mt-6 max-h-[70vh] overflow-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-zinc-900 text-zinc-300">
            <tr>
              <th className="px-4 py-3">Coil Number</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Width</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reserved Customer</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Gauge</th>
              <th className="px-4 py-3">Rockwell</th>
              <th className="px-4 py-3">Finish</th>
              <th className="px-4 py-3">Supplier</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredCoils.map((coil) => (
              <tr key={coil.id} className="bg-zinc-950">
                <td className="px-4 py-3 font-semibold">{coil.coilNumber}</td>
                <td className="px-4 py-3">{coil.grade}</td>
                <td className="px-4 py-3">{coil.width}</td>
                <td className="px-4 py-3">{coil.weight.toLocaleString()}</td>
                <td className="px-4 py-3">{coil.status}</td>
                <td className="px-4 py-3">{coil.reservedCustomer ?? "-"}</td>
                <td className="px-4 py-3">{coil.location ?? "-"}</td>
                <td className="px-4 py-3">{coil.gauge ?? "-"}</td>
                <td className="px-4 py-3">{coil.rockwell ?? "-"}</td>
                <td className="px-4 py-3">{coil.finish ?? "-"}</td>
                <td className="px-4 py-3">{coil.supplier ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCoils.length === 0 ? (
          <p className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
            No coils match that filter.
          </p>
        ) : null}
      </div>
    </>
  );
}
