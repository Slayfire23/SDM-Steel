"use client";

import { useState } from "react";
import { createCoil } from "./actions";

type CustomerOption = {
  customerNumber: string;
  name: string | null;
};

type ReceivingFormProps = {
  customers: CustomerOption[];
  nextCoilNumber: string;
};

const inputClass =
  "mt-2 h-12 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-zinc-50 outline-none focus:border-cyan-300 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-950 disabled:text-zinc-600";
const noSpinnerInputClass = `${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

function formatWholeNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function ReceivingForm({
  customers,
  nextCoilNumber,
}: ReceivingFormProps) {
  const [status, setStatus] = useState("Available");
  const [width, setWidth] = useState("");
  const [weight, setWeight] = useState("");
  const isReserved = status === "Reserved";
  const rawWeight = weight.replace(/,/g, "");

  return (
    <form
      action={createCoil}
      className="mt-10 grid gap-5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:grid-cols-2"
    >
      <div className="flex flex-col rounded-md border border-zinc-800 bg-zinc-950 p-4 sm:col-span-2">
        <span className="text-sm font-semibold text-zinc-300">
          Coil Number
        </span>
        <span className="mt-2 text-2xl font-bold text-cyan-300">
          {nextCoilNumber}
        </span>
        <span className="mt-1 text-sm text-zinc-500">
          This number is assigned automatically and cannot be edited.
        </span>
      </div>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Grade
        <select name="grade" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select grade
          </option>
          <option value="BH">BH</option>
          <option value="HSLA">HSLA</option>
          <option value="SS 50">SS 50</option>
          <option value="SS 55">SS 55</option>
          <option value="CS-B">CS-B</option>
          <option value="CS-A">CS-A</option>
        </select>
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Width
        <input
          name="width"
          type="number"
          step="0.001"
          value={width}
          onChange={(event) => setWidth(event.target.value)}
          onBlur={() => {
            if (width !== "") {
              setWidth(Number(width).toFixed(3));
            }
          }}
          required
          className={noSpinnerInputClass}
        />
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Weight
        <input
          type="text"
          inputMode="numeric"
          value={weight}
          onChange={(event) => setWeight(formatWholeNumber(event.target.value))}
          required
          className={noSpinnerInputClass}
        />
        <input type="hidden" name="weight" value={rawWeight} />
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Status
        <select
          name="status"
          required
          className={inputClass}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="Available">Available</option>
          <option value="Reserved">Reserved</option>
          <option value="Hold">Hold</option>
        </select>
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200 sm:col-span-2">
        Reserved Customer
        <select
          name="reservedCustomer"
          disabled={!isReserved}
          required={isReserved}
          className={inputClass}
          defaultValue=""
        >
          <option value="">
            {isReserved ? "Select a customer" : "Only available for reserved coils"}
          </option>
          {customers.map((customer) => (
            <option key={customer.customerNumber} value={customer.customerNumber}>
              {customer.customerNumber}
              {customer.name ? ` - ${customer.name}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Location
        <input name="location" className={inputClass} />
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Gauge
        <input
          name="gauge"
          type="number"
          step="0.0001"
          className={noSpinnerInputClass}
        />
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Rockwell
        <input
          name="rockwell"
          type="number"
          step="0.1"
          className={noSpinnerInputClass}
        />
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Finish
        <select name="finish" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select finish
          </option>
          <option value="HDG">HDG</option>
          <option value="GNL">GNL</option>
          <option value="CR">CR</option>
          <option value="HRPO">HRPO</option>
        </select>
      </label>

      <label className="flex flex-col text-sm font-semibold text-zinc-200">
        Supplier
        <input name="supplier" className={inputClass} />
      </label>

      <button
        type="submit"
        className="mt-3 h-12 rounded-md bg-cyan-400 px-6 font-bold text-zinc-950 transition hover:bg-cyan-300 sm:col-span-2"
      >
        Add Coil
      </button>
    </form>
  );
}
