"use client";

import { useEffect, useMemo, useState } from "react";

type FinishedGood = {
  id: string;
  setupNumber: string;
  tagNumber: string;
  originalCoil: string;
  customer: string;
  smNumber: string;
  width: string;
  weight: number;
  gauge: string;
  finish: string;
  completedDate: string;
};

const finishedGoodsStorageKey = "coiltrackFinishedGoods";

export default function FinishedGoodsTable() {
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const savedFinishedGoods = JSON.parse(
      window.localStorage.getItem(finishedGoodsStorageKey) ?? "[]",
    ) as FinishedGood[];

    setFinishedGoods(savedFinishedGoods);
  }, []);

  const filteredFinishedGoods = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    if (!search) {
      return finishedGoods;
    }

    return finishedGoods.filter((finishedGood) =>
      [
        finishedGood.tagNumber,
        finishedGood.originalCoil,
        finishedGood.customer,
        finishedGood.smNumber,
        finishedGood.setupNumber,
        finishedGood.finish,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [finishedGoods, searchValue]);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-2 text-sm text-zinc-300">
          Search Finished Goods
          <input
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none placeholder:text-zinc-600 focus:border-cyan-400"
            placeholder="Search tag, coil, customer, SM, setup, or finish"
            type="text"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </label>
        <p className="text-sm text-zinc-400">
          Showing {filteredFinishedGoods.length} of {finishedGoods.length}
        </p>
      </div>

      <div className="mt-6 max-h-[70vh] overflow-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-zinc-900 text-zinc-300">
            <tr>
              <th className="px-4 py-3">FG Tag</th>
              <th className="px-4 py-3">Original Coil</th>
              <th className="px-4 py-3">Setup</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">SM #</th>
              <th className="px-4 py-3">Width</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Gauge</th>
              <th className="px-4 py-3">Finish</th>
              <th className="px-4 py-3">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredFinishedGoods.map((finishedGood) => (
              <tr key={finishedGood.id} className="bg-zinc-950">
                <td className="px-4 py-3 font-bold text-cyan-300">
                  {finishedGood.tagNumber}
                </td>
                <td className="px-4 py-3">{finishedGood.originalCoil}</td>
                <td className="px-4 py-3">{finishedGood.setupNumber}</td>
                <td className="px-4 py-3">{finishedGood.customer}</td>
                <td className="px-4 py-3">{finishedGood.smNumber}</td>
                <td className="px-4 py-3">{finishedGood.width}</td>
                <td className="px-4 py-3">
                  {finishedGood.weight.toLocaleString()}
                </td>
                <td className="px-4 py-3">{finishedGood.gauge}</td>
                <td className="px-4 py-3">{finishedGood.finish}</td>
                <td className="px-4 py-3">{finishedGood.completedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFinishedGoods.length === 0 ? (
          <p className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
            No finished goods have been created yet.
          </p>
        ) : null}
      </div>
    </>
  );
}
