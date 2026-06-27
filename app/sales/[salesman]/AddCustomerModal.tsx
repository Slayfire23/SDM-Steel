"use client";

import { useState } from "react";
import { createCustomer } from "../actions";

type AddCustomerModalProps = {
  nextCustomerNumber: string;
  salesman: string;
};

const inputClass =
  "mt-2 h-12 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-cyan-300";

export default function AddCustomerModal({
  nextCustomerNumber,
  salesman,
}: AddCustomerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-8 h-12 rounded-md bg-cyan-400 px-6 font-bold text-zinc-950 transition hover:bg-cyan-300"
      >
        Create New Customer
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Create Customer</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Add a new customer for {salesman}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-cyan-300 hover:text-cyan-300"
              >
                Close
              </button>
            </div>

            <form action={createCustomer} className="mt-6 grid gap-5 sm:grid-cols-2">
              <input type="hidden" name="salesman" value={salesman} />

              <div className="flex flex-col rounded-md border border-zinc-800 bg-zinc-900 p-4 sm:col-span-2">
                <span className="text-sm font-semibold text-zinc-300">
                  Customer Number
                </span>
                <span className="mt-2 text-2xl font-bold text-cyan-300">
                  {nextCustomerNumber}
                </span>
                <span className="mt-1 text-sm text-zinc-500">
                  This number is assigned automatically and cannot be edited.
                </span>
              </div>

              <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-zinc-300">Salesman</p>
                <p className="mt-2 text-lg font-bold text-cyan-300">
                  {salesman}
                </p>
              </div>

              <label className="flex flex-col text-sm font-semibold text-zinc-200">
                Customer Name
                <input name="name" required className={inputClass} />
              </label>

              <label className="flex flex-col text-sm font-semibold text-zinc-200">
                Contact Name
                <input name="contactName" className={inputClass} />
              </label>

              <label className="flex flex-col text-sm font-semibold text-zinc-200">
                Email
                <input name="email" type="email" className={inputClass} />
              </label>

              <label className="flex flex-col text-sm font-semibold text-zinc-200">
                Phone
                <input name="phone" className={inputClass} />
              </label>

              <label className="flex flex-col text-sm font-semibold text-zinc-200">
                Status
                <select
                  name="status"
                  required
                  className={inputClass}
                  defaultValue="Active"
                >
                  <option value="Active">Active</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Hold">Hold</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <label className="flex flex-col text-sm font-semibold text-zinc-200">
                Address
                <input name="address" className={inputClass} />
              </label>

              <button
                type="submit"
                className="mt-3 h-12 rounded-md bg-cyan-400 px-6 font-bold text-zinc-950 transition hover:bg-cyan-300 sm:col-span-2"
              >
                Add Customer
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
