"use client";

import { useState } from "react";
import { createSalesman } from "./actions";

type SalesmanPickerProps = {
  salesmen: string[];
};

const inputClass =
  "mt-2 h-12 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-cyan-300";

export default function SalesmanPicker({ salesmen }: SalesmanPickerProps) {
  const [selectedSalesman, setSelectedSalesman] = useState("");

  return (
    <div className="mt-10 grid gap-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="flex flex-col text-sm font-semibold text-zinc-200">
          Select Salesman
          <select
            className={inputClass}
            value={selectedSalesman}
            onChange={(event) => setSelectedSalesman(event.target.value)}
          >
            <option value="">Choose a salesman</option>
            {salesmen.map((salesman) => (
              <option key={salesman} value={salesman}>
                {salesman}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            window.location.assign(
              `/sales/${encodeURIComponent(selectedSalesman)}`,
            );
          }}
          className="h-12 rounded-md bg-cyan-400 px-6 font-bold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 sm:self-end"
          disabled={!selectedSalesman}
        >
          Open
        </button>
      </div>

      <form
        action={createSalesman}
        className="grid gap-4 border-t border-zinc-800 pt-6 sm:grid-cols-[1fr_auto]"
      >
        <label className="flex flex-col text-sm font-semibold text-zinc-200">
          New Salesman
          <input name="salesman" className={inputClass} required />
        </label>

        <button
          type="submit"
          className="h-12 rounded-md bg-cyan-400 px-6 font-bold text-zinc-950 transition hover:bg-cyan-300 sm:self-end"
        >
          Create Page
        </button>
      </form>
    </div>
  );
}
