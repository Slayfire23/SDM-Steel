"use client";

import { useRouter } from "next/navigation";

type SalesmanSwitcherProps = {
  currentSalesman: string;
  salesmen: string[];
};

const inputClass =
  "mt-2 h-12 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-cyan-300";

export default function SalesmanSwitcher({
  currentSalesman,
  salesmen,
}: SalesmanSwitcherProps) {
  const router = useRouter();
  const options = salesmen.includes(currentSalesman)
    ? salesmen
    : [currentSalesman, ...salesmen];

  return (
    <label className="mt-8 flex max-w-sm flex-col text-sm font-semibold text-zinc-200">
      Change Salesman
      <select
        className={inputClass}
        value={currentSalesman}
        onChange={(event) => {
          router.push(`/sales/${encodeURIComponent(event.target.value)}`);
        }}
      >
        {options.map((salesman) => (
          <option key={salesman} value={salesman}>
            {salesman}
          </option>
        ))}
      </select>
    </label>
  );
}
