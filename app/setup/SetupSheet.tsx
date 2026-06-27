"use client";

import { useEffect, useMemo, useState } from "react";
import { createNewSetup } from "./actions";

type SalesMemoOption = {
  id: string;
  memoNumber: string;
  customer: string;
  salesman: string;
  grade: string;
  finish: string;
  gauge: string;
  width: string;
  weight: number;
  dueDate: string;
  status: string;
  notes: string;
};

type SetupRow = {
  rowId: number;
  slit: string;
  ticketNumber: string;
  width: string;
  weight: string;
  cutWidth: string;
  idBreak: string;
  calcOd: string;
  customerCuts: string[];
  customerPlugs: string[];
  customerPlugWeights: string[];
  customerTotalWeights: string[];
};

type CustomerPanel = {
  customer: string;
  memoNumber: string;
  refNumber: string;
  widthDecimal: string;
};

type StockCoilOption = {
  coilNumber: string;
  finish: string;
  gauge: string;
  weight: number;
  width: string;
};

type SetupSheetProps = {
  salesMemos: SalesMemoOption[];
  setupNumber: string;
  stockCoils: StockCoilOption[];
};

const panelCount = 6;

const cellInput =
  "h-6 w-full bg-slate-50 px-1 text-center text-sm font-bold leading-none text-zinc-950 outline-none focus:bg-cyan-100";
const totalWeightInput =
  "h-6 w-[calc(100%-12px)] justify-self-center bg-slate-50 px-1 text-center text-sm font-bold leading-none text-zinc-950 outline-none focus:bg-cyan-100";
const labelCell = "border-2 border-zinc-950 bg-slate-200 px-1 py-0.5 text-center leading-tight";
const heavyRight = "border-r-4 border-zinc-950";
const setupGridColumns = "grid-cols-[520px_repeat(6,200px)]";
const customerTableColumns = "grid-cols-[40px_40px_60px_60px]";
const steelWeightFactor = 0.2223;
const insideDiameter = 20;

function createBlankRow(rowId: number): SetupRow {
  return {
    rowId,
    slit: "",
    ticketNumber: "",
    width: "",
    weight: "",
    cutWidth: "",
    idBreak: "",
    calcOd: "",
    customerCuts: Array(panelCount).fill(""),
    customerPlugs: Array(panelCount).fill(""),
    customerPlugWeights: Array(panelCount).fill(""),
    customerTotalWeights: Array(panelCount).fill(""),
  };
}

function createBlankPanel(): CustomerPanel {
  return {
    customer: "",
    memoNumber: "",
    refNumber: "",
    widthDecimal: "",
  };
}

function fitPanelValues(values: string[]) {
  if (values.length === panelCount) {
    return values;
  }

  return values.length > panelCount
    ? values.slice(0, panelCount)
    : [...values, ...Array(panelCount - values.length).fill("")];
}

function cleanSpec(value: string) {
  return value.trim().toLowerCase();
}

function gaugesMatch(coilGauge: string, memoGauge: string) {
  if (!memoGauge) {
    return true;
  }

  const coilGaugeNumber = Number(coilGauge);
  const memoGaugeNumber = Number(memoGauge);

  if (Number.isFinite(coilGaugeNumber) && Number.isFinite(memoGaugeNumber)) {
    return Math.abs(coilGaugeNumber - memoGaugeNumber) <= 0.001;
  }

  return cleanSpec(coilGauge) === cleanSpec(memoGauge);
}

function finishesMatch(coilFinish: string, memoFinish: string) {
  return !memoFinish || cleanSpec(coilFinish) === cleanSpec(memoFinish);
}

function parseSheetNumber(value: string) {
  const parsedValue = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatSheetWeight(value: number) {
  return Math.round(value).toLocaleString();
}

function formatSheetDecimal(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }

  return value.toFixed(3).replace(/\.?0+$/, "");
}

function calculateBreakOd(coilWeight: number, coilWidth: number, breaks: number) {
  if (coilWeight <= 0 || coilWidth <= 0 || breaks < 0) {
    return 0;
  }

  const pieces = breaks + 1;
  const coilArea = coilWeight / (steelWeightFactor * coilWidth);
  return Math.sqrt(coilArea / pieces + insideDiameter ** 2);
}

function calculateRow(row: SetupRow, panels: CustomerPanel[]) {
  const coilWeight = parseSheetNumber(row.weight);
  const coilWidth = parseSheetNumber(row.width);
  const breaks = parseSheetNumber(row.idBreak);
  const pieces = breaks + 1;
  const customerPlugs = [...row.customerPlugs];
  const customerPlugWeights = [...row.customerPlugWeights];
  const customerTotalWeights = [...row.customerTotalWeights];
  const cutWidth = row.customerCuts.reduce((total, cutsValue, index) => {
    const cuts = parseSheetNumber(cutsValue);
    const customerWidth = parseSheetNumber(panels[index]?.widthDecimal ?? "");
    const plugWeight =
      coilWeight > 0 && coilWidth > 0 && customerWidth > 0 && pieces > 0
        ? (coilWeight * customerWidth) / coilWidth / pieces
        : 0;
    const totalPlugs = cuts * pieces;

    customerPlugs[index] =
      cuts > 0 && pieces > 0 ? totalPlugs.toLocaleString() : "";
    customerPlugWeights[index] = plugWeight ? formatSheetWeight(plugWeight) : "";
    customerTotalWeights[index] =
      totalPlugs > 0 && plugWeight
        ? formatSheetWeight(plugWeight * totalPlugs)
        : "";

    return total + customerWidth * cuts;
  }, 0);
  const calcOd = calculateBreakOd(coilWeight, coilWidth, breaks);

  return {
    ...row,
    cutWidth: formatSheetDecimal(cutWidth),
    calcOd: formatSheetDecimal(calcOd),
    customerPlugs,
    customerPlugWeights,
    customerTotalWeights,
  };
}

function todayShortDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

export default function SetupSheet({
  salesMemos,
  setupNumber,
  stockCoils,
}: SetupSheetProps) {
  const [machine, setMachine] = useState("96");
  const [gauge, setGauge] = useState("");
  const [finish, setFinish] = useState("");
  const [dateApplied, setDateApplied] = useState(todayShortDate());
  const [applier, setApplier] = useState("");
  const [isCoilModalOpen, setIsCoilModalOpen] = useState(false);
  const [isRemoveCoilModalOpen, setIsRemoveCoilModalOpen] = useState(false);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [coilSearch, setCoilSearch] = useState("");
  const [selectedMemoNumber, setSelectedMemoNumber] = useState("");
  const [specMemoNumber, setSpecMemoNumber] = useState("");
  const [specCoilSearch, setSpecCoilSearch] = useState("");
  const [specAppliedCoilRowId, setSpecAppliedCoilRowId] = useState("");
  const [rows, setRows] = useState<SetupRow[]>(
    Array.from({ length: 20 }, (_, index) => createBlankRow(index + 1)),
  );
  const [panels, setPanels] = useState<CustomerPanel[]>(
    Array.from({ length: panelCount }, () => createBlankPanel()),
  );

  useEffect(() => {
    setPanels((currentPanels) => {
      if (currentPanels.length === panelCount) {
        return currentPanels;
      }

      return currentPanels.length > panelCount
        ? currentPanels.slice(0, panelCount)
        : [
            ...currentPanels,
            ...Array.from(
              { length: panelCount - currentPanels.length },
              () => createBlankPanel(),
            ),
          ];
    });

    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        customerCuts: fitPanelValues(row.customerCuts),
        customerPlugs: fitPanelValues(row.customerPlugs),
        customerPlugWeights: fitPanelValues(row.customerPlugWeights),
        customerTotalWeights: fitPanelValues(row.customerTotalWeights),
      })),
    );
  }, []);

  useEffect(() => {
    setRows((currentRows) =>
      currentRows.map((row) => calculateRow(row, panels)),
    );
  }, [panels]);

  const memoByNumber = useMemo(
    () =>
      new Map(
        salesMemos.map((memo) => [memo.memoNumber.toLowerCase(), memo]),
      ),
    [salesMemos],
  );
  const coilByNumber = useMemo(
    () =>
      new Map(
        stockCoils.map((coil) => [coil.coilNumber.toLowerCase(), coil]),
      ),
    [stockCoils],
  );
  const selectedMemo =
    memoByNumber.get(selectedMemoNumber.trim().toLowerCase()) ?? null;
  const specMemo =
    memoByNumber.get(specMemoNumber.trim().toLowerCase()) ?? null;
  const selectedCoilRows = rows.filter((row) => row.ticketNumber.trim());
  const specAppliedCoilRow =
    selectedCoilRows.find(
      (row) => row.rowId.toString() === specAppliedCoilRowId,
    ) ?? null;
  const specAppliedCoil =
    specAppliedCoilRow
      ? (coilByNumber.get(
          specAppliedCoilRow.ticketNumber.trim().toLowerCase(),
        ) ?? {
          coilNumber: specAppliedCoilRow.ticketNumber,
          finish,
          gauge,
          weight: parseSheetNumber(specAppliedCoilRow.weight),
          width: specAppliedCoilRow.width,
        })
      : null;
  const matchingCoils = useMemo(() => {
    const searchValue = coilSearch.trim().toLowerCase();
    const memoWidth = selectedMemo ? Number(selectedMemo.width) : null;

    return stockCoils.filter((coil) => {
      const matchesSearch =
        !searchValue ||
        coil.coilNumber.toLowerCase().includes(searchValue) ||
        coil.gauge.toLowerCase().includes(searchValue) ||
        coil.finish.toLowerCase().includes(searchValue);
      const matchesGauge = selectedMemo
        ? gaugesMatch(coil.gauge, selectedMemo.gauge)
        : true;
      const matchesFinish = selectedMemo
        ? finishesMatch(coil.finish, selectedMemo.finish)
        : true;
      const matchesWidth =
        !memoWidth || Number(coil.width) >= memoWidth;

      return matchesSearch && matchesGauge && matchesFinish && matchesWidth;
    });
  }, [coilSearch, selectedMemo, stockCoils]);
  const specMatchingCoils = useMemo(() => {
    if (!specMemo) {
      return [];
    }

    const searchValue = specCoilSearch.trim().toLowerCase();
    const memoWidth = Number(specMemo.width);

    return stockCoils.filter((coil) => {
      const matchesSearch =
        !searchValue ||
        coil.coilNumber.toLowerCase().includes(searchValue) ||
        coil.gauge.toLowerCase().includes(searchValue) ||
        coil.finish.toLowerCase().includes(searchValue) ||
        coil.width.toLowerCase().includes(searchValue);
      const matchesGauge = gaugesMatch(coil.gauge, specMemo.gauge);
      const matchesFinish = finishesMatch(coil.finish, specMemo.finish);
      const matchesWidth = !memoWidth || Number(coil.width) >= memoWidth;

      return matchesSearch && matchesGauge && matchesFinish && matchesWidth;
    });
  }, [specCoilSearch, specMemo, stockCoils]);
  const specMatchingMemos = useMemo(() => {
    if (!specAppliedCoil) {
      return [];
    }

    const coilWidth = Number(specAppliedCoil.width);

    return salesMemos.filter((memo) => {
      const memoWidth = Number(memo.width);
      const matchesGauge = gaugesMatch(specAppliedCoil.gauge, memo.gauge);
      const matchesFinish = finishesMatch(specAppliedCoil.finish, memo.finish);
      const matchesWidth = !memoWidth || !coilWidth || memoWidth <= coilWidth;

      return matchesGauge && matchesFinish && matchesWidth;
    });
  }, [salesMemos, specAppliedCoil]);

  function updateRow(rowId: number, updates: Partial<SetupRow>) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowId === rowId ? calculateRow({ ...row, ...updates }, panels) : row,
      ),
    );
  }

  function updateCustomerRow(
    rowId: number,
    panelIndex: number,
    field:
      | "customerCuts"
      | "customerPlugs"
      | "customerPlugWeights"
      | "customerTotalWeights",
    value: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.rowId !== rowId) {
          return row;
        }

        const values = [...row[field]];
        values[panelIndex] = value;

        if (field === "customerCuts") {
          return calculateRow({
            ...row,
            customerCuts: values,
          }, panels);
        }

        return {
          ...row,
          [field]: values,
        };
      }),
    );
  }

  function updatePanel(index: number, updates: Partial<CustomerPanel>) {
    setPanels((currentPanels) =>
      currentPanels.map((panel, panelIndex) =>
        panelIndex === index ? { ...panel, ...updates } : panel,
      ),
    );
  }

  function handleMemoChange(index: number, memoNumber: string) {
    const memo = memoByNumber.get(memoNumber.trim().toLowerCase());

    if (!memo) {
      updatePanel(index, {
        customer: "",
        memoNumber,
        widthDecimal: "",
      });
      return;
    }

    updatePanel(index, {
      customer: memo.customer,
      memoNumber,
      widthDecimal: memo.width,
    });
  }

  function addMemoToSetup(memo: SalesMemoOption) {
    const openPanelIndex = panels.findIndex((panel) => !panel.memoNumber);
    const panelIndex = openPanelIndex === -1 ? 0 : openPanelIndex;

    updatePanel(panelIndex, {
      customer: memo.customer,
      memoNumber: memo.memoNumber,
      widthDecimal: memo.width,
    });
    setSpecMemoNumber(memo.memoNumber);
  }

  function handleCoilChange(rowId: number, coilNumber: string) {
    const coil = coilByNumber.get(coilNumber.trim().toLowerCase());

    if (!coil) {
      updateRow(rowId, {
        ticketNumber: coilNumber,
      });
      return;
    }

    updateRow(rowId, {
      ticketNumber: coilNumber,
      weight: coil.weight.toLocaleString(),
      width: coil.width,
    });
    setGauge(coil.gauge);
    setFinish(coil.finish);
  }

  function addCoilToSetup(coil: StockCoilOption) {
    const openRow = rows.find((row) => !row.ticketNumber) ?? rows[0];
    const openPanelIndex = panels.findIndex((panel) => !panel.memoNumber);
    const panelIndex = openPanelIndex === -1 ? 0 : openPanelIndex;

    updateRow(openRow.rowId, {
      ticketNumber: coil.coilNumber,
      weight: coil.weight.toLocaleString(),
      width: coil.width,
      cutWidth: selectedMemo?.width ?? "",
    });
    setGauge(coil.gauge);
    setFinish(coil.finish);

    if (selectedMemo) {
      updatePanel(panelIndex, {
        customer: selectedMemo.customer,
        memoNumber: selectedMemo.memoNumber,
        widthDecimal: selectedMemo.width,
      });
    }

    setIsCoilModalOpen(false);
  }

  function removeCoilFromSetup(rowId: number) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowId === rowId ? createBlankRow(row.rowId) : row,
      ),
    );
    setIsRemoveCoilModalOpen(false);
  }

  async function submitSetupToSchedule() {
    const submittedSetup = {
      setupNumber,
      dateApplied,
      applier,
      machine,
      gauge,
      finish,
      submittedAt: new Date().toISOString(),
      coils: rows
        .filter((row) => row.ticketNumber.trim())
        .map((row) => ({
          coilNumber: row.ticketNumber,
          width: row.width,
          weight: row.weight,
          cutWidth: row.cutWidth,
          breaks: row.idBreak,
          calcOd: row.calcOd,
        })),
      salesMemos: panels
        .filter((panel) => panel.memoNumber.trim())
        .map((panel) => ({
          memoNumber: panel.memoNumber,
          customer: panel.customer,
          width: panel.widthDecimal,
        })),
    };
    const savedSetups = JSON.parse(
      window.localStorage.getItem("coiltrackSubmittedSetups") ?? "[]",
    ) as typeof submittedSetup[];
    const nextSetups = [
      submittedSetup,
      ...savedSetups.filter(
        (setup) => setup.setupNumber !== submittedSetup.setupNumber,
      ),
    ];

    window.localStorage.setItem(
      "coiltrackSubmittedSetups",
      JSON.stringify(nextSetups),
    );

    await fetch("/api/scheduled-setups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submittedSetup),
    });

    window.location.href = "/schedule";
  }

  return (
    <>
      <datalist id="sales-memo-options">
        {salesMemos.map((memo) => (
          <option key={memo.id} value={memo.memoNumber}>
            {memo.customer}
          </option>
        ))}
      </datalist>
      <datalist id="stock-coil-options">
        {stockCoils.map((coil) => (
          <option key={coil.coilNumber} value={coil.coilNumber}>
            {coil.gauge} {coil.finish}
          </option>
        ))}
      </datalist>

      <div className="mx-auto mt-8 w-fit max-w-full overflow-auto rounded-sm border-2 border-zinc-950 bg-slate-100 text-zinc-950 shadow-xl">
        <div className="w-[1720px]">
          <div className={`grid ${setupGridColumns} border-b-2 border-zinc-950`}>
            <div className={`${labelCell} ${heavyRight} grid grid-cols-[90px_120px_120px_140px] items-start gap-1 p-1`}>
              <div className="text-sm">
                <p>SetUp #</p>
                <p className="text-lg font-black">{setupNumber}</p>
              </div>
              <label>
                <p>Date Applied</p>
                <input
                  className={cellInput}
                  value={dateApplied}
                  onChange={(event) => setDateApplied(event.target.value)}
                />
              </label>
              <label>
                <p>Applier</p>
                <input
                  className={cellInput}
                  value={applier}
                  onChange={(event) => setApplier(event.target.value)}
                />
              </label>
              <button
                className="mt-5 h-7 border-2 border-zinc-700 bg-slate-300 text-sm font-bold shadow-inner hover:bg-slate-100"
                type="button"
                onClick={() => setIsSpecsModalOpen(true)}
              >
                SM Specs
              </button>
            </div>
            {panels.map((panel, index) => (
              <div
                key={`customer-${index}`}
                className={`${labelCell} ${index === panels.length - 1 ? "" : heavyRight}`}
              >
                <p>Customer</p>
                <input
                  className={`${cellInput} text-base`}
                  value={panel.customer}
                  readOnly
                />
              </div>
            ))}
          </div>

          <div className={`grid ${setupGridColumns} border-b-2 border-zinc-950`}>
            <div className={`${labelCell} ${heavyRight} flex items-center justify-center gap-3`}>
              <form action={createNewSetup}>
                <button
                  className="h-8 w-32 border-2 border-zinc-700 bg-slate-300 text-sm font-bold shadow-inner hover:bg-slate-100"
                  type="submit"
                >
                  New SetUp
                </button>
              </form>
              <button
                className="h-8 w-32 border-2 border-zinc-700 bg-slate-300 text-sm font-bold shadow-inner hover:bg-slate-100"
                type="button"
                onClick={submitSetupToSchedule}
              >
                Submit Setup
              </button>
              <button
                className="h-8 w-32 border-2 border-zinc-700 bg-slate-300 text-sm font-bold shadow-inner hover:bg-slate-100"
                type="button"
                onClick={() => setIsCoilModalOpen(true)}
              >
                Add Coil
              </button>
              <button
                className="h-8 w-32 border-2 border-zinc-700 bg-slate-300 text-sm font-bold shadow-inner hover:bg-slate-100"
                type="button"
                onClick={() => setIsRemoveCoilModalOpen(true)}
              >
                Remove Coil
              </button>
            </div>
            {panels.map((panel, index) => (
              <label
                key={`memo-${index}`}
                className={`${labelCell} ${index === panels.length - 1 ? "" : heavyRight} grid content-start gap-1`}
              >
                <p className="leading-none">SM #</p>
                <input
                  className={cellInput}
                  list="sales-memo-options"
                  value={panel.memoNumber}
                  onChange={(event) =>
                    handleMemoChange(index, event.target.value)
                  }
                />
              </label>
            ))}
          </div>

          <div className={`grid ${setupGridColumns} border-b-2 border-zinc-950`}>
            <div className={`${labelCell} ${heavyRight} grid grid-cols-3 items-start gap-2 p-1`}>
              <label>
                <p>Machine</p>
                <input
                  className={cellInput}
                  value={machine}
                  onChange={(event) => setMachine(event.target.value)}
                />
              </label>
              <label>
                <p>Gauge</p>
                <input
                  className={cellInput}
                  value={gauge}
                  onChange={(event) => setGauge(event.target.value)}
                />
              </label>
              <label>
                <p>Finish</p>
                <select
                  className={cellInput}
                  value={finish}
                  onChange={(event) => setFinish(event.target.value)}
                >
                  <option value=""></option>
                  <option value="HDG">HDG</option>
                  <option value="GNL">GNL</option>
                  <option value="CR">CR</option>
                  <option value="HRPO">HRPO</option>
                </select>
              </label>
            </div>
            {panels.map((panel, index) => (
              <label
                key={`width-${index}`}
                className={`${labelCell} ${index === panels.length - 1 ? "" : heavyRight}`}
              >
                <p>Width</p>
                <input
                  className={cellInput}
                  value={panel.widthDecimal}
                  onChange={(event) =>
                    updatePanel(index, { widthDecimal: event.target.value })
                  }
                />
              </label>
            ))}
          </div>

          <table className="w-[1720px] table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200">
                <th className="w-[70px] border-2 border-zinc-950 px-1 py-1">Slit</th>
                <th className="w-[100px] border-2 border-zinc-950 px-1 py-1">Tag Number</th>
                <th className="w-[80px] border-2 border-zinc-950 px-1 py-1">Width</th>
                <th className="w-[85px] border-2 border-zinc-950 px-1 py-1">Weight</th>
                <th className="w-[85px] border-2 border-zinc-950 px-1 py-1">Cut Width</th>
                <th className="w-[40px] border-2 border-zinc-950 px-1 py-1"># of Brk</th>
                <th className={`w-[60px] border-2 border-zinc-950 px-1 py-1 ${heavyRight}`}>
                  Calc OD
                </th>
                {panels.map((_, index) => (
                  <th
                    key={`panel-head-${index}`}
                    className={`border-2 border-zinc-950 p-0 ${index === panels.length - 1 ? "" : heavyRight}`}
                    colSpan={4}
                  >
                    <div className={`grid ${customerTableColumns}`}>
                      <span className="border-r-2 border-zinc-950 px-1 py-1">No. Cuts</span>
                      <span className="border-r-2 border-zinc-950 px-1 py-1"># of Plugs</span>
                      <span className="border-r-2 border-zinc-950 px-1 py-1">Plug Wt</span>
                      <span className="px-1 py-1">Total Wt</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowId} className="bg-slate-100">
                  <td className="h-7 border-2 border-zinc-950">
                    <input
                      className={cellInput}
                      value={row.slit}
                      onChange={(event) =>
                        updateRow(row.rowId, { slit: event.target.value })
                      }
                    />
                  </td>
                  <td className="border-2 border-zinc-950">
                    <input
                      className={cellInput}
                      list="stock-coil-options"
                      value={row.ticketNumber}
                      onChange={(event) =>
                        handleCoilChange(row.rowId, event.target.value)
                      }
                    />
                  </td>
                  <td className="border-2 border-zinc-950">
                    <input
                      className={cellInput}
                      value={row.width}
                      onChange={(event) =>
                        updateRow(row.rowId, { width: event.target.value })
                      }
                    />
                  </td>
                  <td className="border-2 border-zinc-950">
                    <input
                      className={cellInput}
                      value={row.weight}
                      onChange={(event) =>
                        updateRow(row.rowId, { weight: event.target.value })
                      }
                    />
                  </td>
                  <td className="border-2 border-zinc-950">
                    <input
                      className={`${cellInput} bg-slate-200`}
                      readOnly
                      value={row.cutWidth}
                    />
                  </td>
                  <td className="border-2 border-zinc-950">
                    <input
                      className={cellInput}
                      value={row.idBreak}
                      onChange={(event) =>
                        updateRow(row.rowId, { idBreak: event.target.value })
                      }
                    />
                  </td>
                  <td className={`border-2 border-zinc-950 ${heavyRight}`}>
                    <input
                      className={`${cellInput} bg-slate-200`}
                      readOnly
                      value={row.calcOd}
                    />
                  </td>
                  {panels.map((_, index) => (
                    <td
                      key={`panel-row-${row.rowId}-${index}`}
                      className={`border-2 border-zinc-950 p-0 ${index === panels.length - 1 ? "" : heavyRight}`}
                      colSpan={4}
                    >
                      <div className={`grid ${customerTableColumns}`}>
                        <input
                          className={`${cellInput} border-r-2 border-zinc-950`}
                          value={row.customerCuts[index]}
                          onChange={(event) =>
                            updateCustomerRow(
                              row.rowId,
                              index,
                              "customerCuts",
                              event.target.value,
                            )
                          }
                        />
                        <input
                          className={`${cellInput} border-r-2 border-zinc-950 bg-slate-200`}
                          readOnly
                          value={row.customerPlugs[index]}
                        />
                        <input
                          className={`${cellInput} border-r-2 border-zinc-950 bg-slate-200`}
                          readOnly
                          value={row.customerPlugWeights[index]}
                        />
                        <input
                          className={`${totalWeightInput} bg-slate-200`}
                          readOnly
                          value={row.customerTotalWeights[index]}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCoilModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4">
          <div className="w-full max-w-5xl rounded-lg border border-zinc-700 bg-zinc-950 p-5 text-zinc-50 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Add Coil</h2>
              <button
                className="rounded-md border border-zinc-700 px-3 py-2 font-semibold hover:bg-zinc-800"
                type="button"
                onClick={() => setIsCoilModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-zinc-300">
                Search SM
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
                  list="sales-memo-options"
                  placeholder="Type or choose an SM"
                  value={selectedMemoNumber}
                  onChange={(event) => setSelectedMemoNumber(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-zinc-300">
                Search Coil
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
                  placeholder="Coil, gauge, or finish"
                  value={coilSearch}
                  onChange={(event) => setCoilSearch(event.target.value)}
                />
              </label>
            </div>

            {selectedMemo ? (
              <div className="mt-4 grid gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-4 text-sm md:grid-cols-5">
                <p>
                  <span className="text-zinc-400">Customer</span>
                  <br />
                  <strong>{selectedMemo.customer}</strong>
                </p>
                <p>
                  <span className="text-zinc-400">Grade</span>
                  <br />
                  <strong>{selectedMemo.grade}</strong>
                </p>
                <p>
                  <span className="text-zinc-400">Gauge</span>
                  <br />
                  <strong>{selectedMemo.gauge || "-"}</strong>
                </p>
                <p>
                  <span className="text-zinc-400">Finish</span>
                  <br />
                  <strong>{selectedMemo.finish}</strong>
                </p>
                <p>
                  <span className="text-zinc-400">Width</span>
                  <br />
                  <strong>{selectedMemo.width}</strong>
                </p>
              </div>
            ) : null}

            <div className="mt-5 max-h-[45vh] overflow-auto rounded-md border border-zinc-800">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-zinc-900 text-zinc-300">
                  <tr>
                    <th className="px-3 py-2">Coil</th>
                    <th className="px-3 py-2">Gauge</th>
                    <th className="px-3 py-2">Finish</th>
                    <th className="px-3 py-2">Width</th>
                    <th className="px-3 py-2">Weight</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {matchingCoils.map((coil) => (
                    <tr key={coil.coilNumber} className="bg-zinc-950">
                      <td className="px-3 py-2 font-bold text-cyan-300">
                        {coil.coilNumber}
                      </td>
                      <td className="px-3 py-2">{coil.gauge || "-"}</td>
                      <td className="px-3 py-2">{coil.finish || "-"}</td>
                      <td className="px-3 py-2">{coil.width}</td>
                      <td className="px-3 py-2">
                        {coil.weight.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="rounded-md bg-cyan-400 px-3 py-2 font-bold text-zinc-950 hover:bg-cyan-300"
                          type="button"
                          onClick={() => addCoilToSetup(coil)}
                        >
                          Use Coil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {matchingCoils.length === 0 ? (
                <p className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
                  No coils match that SM search.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isRemoveCoilModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4">
          <div className="w-full max-w-5xl rounded-lg border border-zinc-700 bg-zinc-950 p-5 text-zinc-50 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Remove Coil</h2>
              <button
                className="rounded-md border border-zinc-700 px-3 py-2 font-semibold hover:bg-zinc-800"
                type="button"
                onClick={() => setIsRemoveCoilModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-5 max-h-[45vh] overflow-auto rounded-md border border-zinc-800">
              {selectedCoilRows.length > 0 ? (
                <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-900 text-zinc-300">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Coil</th>
                      <th className="px-3 py-2">Width</th>
                      <th className="px-3 py-2">Weight</th>
                      <th className="px-3 py-2">Cut Width</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {selectedCoilRows.map((row) => (
                      <tr key={`remove-${row.rowId}`} className="bg-zinc-950">
                        <td className="px-3 py-2">{row.rowId}</td>
                        <td className="px-3 py-2 font-bold text-cyan-300">
                          {row.ticketNumber}
                        </td>
                        <td className="px-3 py-2">{row.width || "-"}</td>
                        <td className="px-3 py-2">{row.weight || "-"}</td>
                        <td className="px-3 py-2">{row.cutWidth || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            className="rounded-md bg-red-500 px-3 py-2 font-bold text-white hover:bg-red-400"
                            type="button"
                            onClick={() => removeCoilFromSetup(row.rowId)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
                  No coils are selected on this setup.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isSpecsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-50 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 p-5">
              <h2 className="text-2xl font-bold">SM Specs</h2>
              <button
                className="rounded-md border border-zinc-700 px-3 py-2 font-semibold hover:bg-zinc-800"
                type="button"
                onClick={() => setIsSpecsModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-5">
            <label className="mt-5 grid gap-2 text-sm font-semibold text-zinc-300">
              Search SM
              <input
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
                list="sales-memo-options"
                placeholder="Type or choose an SM"
                value={specMemoNumber}
                onChange={(event) => setSpecMemoNumber(event.target.value)}
              />
            </label>

            <label className="mt-4 grid gap-2 text-sm font-semibold text-zinc-300">
              Match SMs To Applied Coil
              <select
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
                value={specAppliedCoilRowId}
                onChange={(event) => setSpecAppliedCoilRowId(event.target.value)}
              >
                <option value="">Choose a coil on this setup</option>
                {selectedCoilRows.map((row) => (
                  <option key={`spec-coil-${row.rowId}`} value={row.rowId}>
                    Row {row.rowId} - {row.ticketNumber} - {row.width || "-"}"
                  </option>
                ))}
              </select>
            </label>

            {specAppliedCoil ? (
              <>
                <div className="mt-4 grid gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm md:grid-cols-5">
                  <p>
                    <span className="text-zinc-400">Applied Coil</span>
                    <br />
                    <strong>{specAppliedCoil.coilNumber}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Gauge</span>
                    <br />
                    <strong>{specAppliedCoil.gauge || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Finish</span>
                    <br />
                    <strong>{specAppliedCoil.finish || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Width</span>
                    <br />
                    <strong>{specAppliedCoil.width || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Weight</span>
                    <br />
                    <strong>{specAppliedCoil.weight.toLocaleString()}</strong>
                  </p>
                </div>

                <div className="mt-4 max-h-[26vh] overflow-auto rounded-md border border-zinc-800">
                  <table className="w-full min-w-[840px] border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-900 text-zinc-300">
                      <tr>
                        <th className="px-3 py-2">SM #</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Gauge</th>
                        <th className="px-3 py-2">Finish</th>
                        <th className="px-3 py-2">Width</th>
                        <th className="px-3 py-2">Weight</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {specMatchingMemos.map((memo) => (
                        <tr key={`matching-sm-${memo.id}`} className="bg-zinc-950">
                          <td className="px-3 py-2 font-bold text-cyan-300">
                            {memo.memoNumber}
                          </td>
                          <td className="px-3 py-2">{memo.customer}</td>
                          <td className="px-3 py-2">{memo.gauge || "-"}</td>
                          <td className="px-3 py-2">{memo.finish || "-"}</td>
                          <td className="px-3 py-2">{memo.width || "-"}</td>
                          <td className="px-3 py-2">
                            {memo.weight.toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                            <button
                              className="rounded-md bg-cyan-400 px-3 py-2 font-bold text-zinc-950 hover:bg-cyan-300"
                              type="button"
                              onClick={() => setSpecMemoNumber(memo.memoNumber)}
                            >
                              View
                            </button>
                            <button
                              className="rounded-md bg-emerald-400 px-3 py-2 font-bold text-zinc-950 hover:bg-emerald-300"
                              type="button"
                              onClick={() => addMemoToSetup(memo)}
                            >
                              Add SM
                            </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {specMatchingMemos.length === 0 ? (
                    <p className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
                      No SMs match this coil.
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            {specMemo ? (
              <>
                <div className="mt-5 grid gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-4 text-sm md:grid-cols-3">
                  <p>
                    <span className="text-zinc-400">SM #</span>
                    <br />
                    <strong>{specMemo.memoNumber}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Customer</span>
                    <br />
                    <strong>{specMemo.customer}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Salesman</span>
                    <br />
                    <strong>{specMemo.salesman || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Grade</span>
                    <br />
                    <strong>{specMemo.grade || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Gauge</span>
                    <br />
                    <strong>{specMemo.gauge || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Finish</span>
                    <br />
                    <strong>{specMemo.finish || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Width</span>
                    <br />
                    <strong>{specMemo.width || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Weight</span>
                    <br />
                    <strong>{specMemo.weight.toLocaleString()}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Due Date</span>
                    <br />
                    <strong>{specMemo.dueDate || "-"}</strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Status</span>
                    <br />
                    <strong>{specMemo.status || "-"}</strong>
                  </p>
                  <p className="md:col-span-2">
                    <span className="text-zinc-400">Notes</span>
                    <br />
                    <strong>{specMemo.notes || "-"}</strong>
                  </p>
                </div>

                <label className="mt-5 grid gap-2 text-sm font-semibold text-zinc-300">
                  Filter Matching Coils
                  <input
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-50 outline-none focus:border-cyan-400"
                    placeholder="Coil, gauge, finish, or width"
                    value={specCoilSearch}
                    onChange={(event) => setSpecCoilSearch(event.target.value)}
                  />
                </label>

                <div className="mt-4 max-h-[32vh] overflow-auto rounded-md border border-zinc-800">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-900 text-zinc-300">
                      <tr>
                        <th className="px-3 py-2">Coil</th>
                        <th className="px-3 py-2">Gauge</th>
                        <th className="px-3 py-2">Finish</th>
                        <th className="px-3 py-2">Width</th>
                        <th className="px-3 py-2">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {specMatchingCoils.map((coil) => (
                        <tr key={`spec-${coil.coilNumber}`} className="bg-zinc-950">
                          <td className="px-3 py-2 font-bold text-cyan-300">
                            {coil.coilNumber}
                          </td>
                          <td className="px-3 py-2">{coil.gauge || "-"}</td>
                          <td className="px-3 py-2">{coil.finish || "-"}</td>
                          <td className="px-3 py-2">{coil.width}</td>
                          <td className="px-3 py-2">
                            {coil.weight.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {specMatchingCoils.length === 0 ? (
                    <p className="bg-zinc-950 px-4 py-8 text-center text-zinc-400">
                      No coils match this SM.
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-5 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-8 text-center text-zinc-400">
                Choose an SM to see its specs.
              </p>
            )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
