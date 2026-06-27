"use client";

import { useEffect, useMemo, useState } from "react";

type SubmittedSetup = {
  setupNumber: string;
  dateApplied: string;
  applier: string;
  machine: string;
  gauge: string;
  finish: string;
  status?: string;
  submittedAt: string;
  coils: {
    coilNumber: string;
    width: string;
    weight: string;
    cutWidth: string;
    breaks: string;
    calcOd: string;
  }[];
  salesMemos: {
    memoNumber: string;
    customer: string;
    width: string;
  }[];
};

type ScheduleAssignment = {
  setupNumber: string;
  scheduleDate: string;
  startTime: string;
  shift: string;
  machine: string;
  priority: string;
  notes: string;
  status?: string;
};

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

type ScheduleBoardProps = {
  initialSetups: SubmittedSetup[];
};

const scheduleStorageKey = "coiltrackScheduleAssignments";
const finishedGoodsStorageKey = "coiltrackFinishedGoods";
const todayValue = new Date().toISOString().slice(0, 10);
const yesterdayValue = "2026-06-25";
const starterScheduleDates = ["2026-06-25", "2026-06-26", "2026-06-29"];
const starterShiftTimes = {
  "1st Shift": ["07:00", "08:30", "10:00", "11:30", "13:00"],
  "2nd Shift": ["15:00", "16:30", "18:00", "19:30", "21:00"],
};

function buildStarterAssignments(setups: SubmittedSetup[]) {
  return setups.slice(0, 30).map((setup, index) => {
    const dateIndex = Math.floor(index / 10);
    const shiftIndex = Math.floor((index % 10) / 5);
    const jobIndex = index % 5;
    const shift = shiftIndex === 0 ? "1st Shift" : "2nd Shift";
    const scheduleDate = starterScheduleDates[dateIndex] ?? "2026-06-29";

    return {
      setupNumber: setup.setupNumber,
      scheduleDate,
      startTime: starterShiftTimes[shift][jobIndex] ?? "07:00",
      shift,
      machine: setup.machine || "96",
      priority: jobIndex === 0 ? "Rush" : "Normal",
      notes:
        scheduleDate === "2026-06-25"
          ? "Starter schedule - yesterday"
          : scheduleDate === "2026-06-26"
            ? "Starter schedule - today"
            : "Starter schedule - Monday",
      status: "Scheduled",
    };
  });
}

function syncScheduledSetupStatus(setupNumbers: string[], status: string) {
  void fetch("/api/scheduled-setups", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      setupNumbers,
      status,
    }),
  });
}

function parseWeight(weight: string) {
  return Number(weight.replace(/,/g, "")) || 0;
}

function tagWithLetter(coilNumber: string, index: number) {
  return `${coilNumber}${String.fromCharCode(65 + index)}`;
}

function buildFinishedGoods(
  setup: SubmittedSetup,
  completedDate: string,
): FinishedGood[] {
  return setup.coils.flatMap((coil) => {
    const cutCount = Math.max(setup.salesMemos.length, 1);
    const pieceWeight = Math.round(parseWeight(coil.weight) / cutCount);

    return Array.from({ length: cutCount }, (_, index) => {
      const memo = setup.salesMemos[index];

      return {
        id: `${setup.setupNumber}-${coil.coilNumber}-${index}`,
        setupNumber: setup.setupNumber,
        tagNumber: tagWithLetter(coil.coilNumber, index),
        originalCoil: coil.coilNumber,
        customer: memo?.customer || "Stock",
        smNumber: memo?.memoNumber || "-",
        width: memo?.width || coil.cutWidth || coil.width,
        weight: pieceWeight,
        gauge: setup.gauge || "-",
        finish: setup.finish || "-",
        completedDate,
      };
    });
  });
}

export default function ScheduleBoard({ initialSetups }: ScheduleBoardProps) {
  const [setups, setSetups] = useState<SubmittedSetup[]>(initialSetups);
  const [selectedSetup, setSelectedSetup] = useState<SubmittedSetup | null>(
    null,
  );
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [scheduleForm, setScheduleForm] = useState<ScheduleAssignment>({
    setupNumber: initialSetups[0]?.setupNumber ?? "",
    scheduleDate: todayValue,
    startTime: "07:00",
    shift: "1st Shift",
    machine: "96",
    priority: "Normal",
    notes: "",
  });

  useEffect(() => {
    const savedSetups = JSON.parse(
      window.localStorage.getItem("coiltrackSubmittedSetups") ?? "[]",
    ) as SubmittedSetup[];
    const savedSetupNumbers = new Set(
      savedSetups.map((setup) => setup.setupNumber),
    );
    const nextSetups = [
      ...savedSetups,
      ...initialSetups.filter(
        (setup) => !savedSetupNumbers.has(setup.setupNumber),
      ),
    ];

    setSetups(nextSetups);
    setScheduleForm((current) => ({
      ...current,
      setupNumber: current.setupNumber || nextSetups[0]?.setupNumber || "",
      machine: current.machine || nextSetups[0]?.machine || "96",
    }));
  }, [initialSetups]);

  useEffect(() => {
    const savedAssignments = JSON.parse(
      window.localStorage.getItem(scheduleStorageKey) ?? "[]",
    ) as ScheduleAssignment[];

    const shouldKeepSavedAssignments =
      savedAssignments.length > 0 &&
      savedAssignments.some(
        (assignment) => !assignment.notes.startsWith("Starter schedule"),
      );

    if (shouldKeepSavedAssignments) {
      setAssignments(savedAssignments);
      return;
    }

    const starterAssignments = buildStarterAssignments(setups);

    setAssignments(starterAssignments);
    window.localStorage.setItem(
      scheduleStorageKey,
      JSON.stringify(starterAssignments),
    );
  }, [setups]);

  useEffect(() => {
    if (setups.length === 0 || assignments.length === 0) {
      return;
    }

    const yesterdayAssignments = assignments.filter(
      (assignment) =>
        assignment.scheduleDate === yesterdayValue &&
        assignment.status !== "Ready to Ship",
    );

    if (yesterdayAssignments.length === 0) {
      return;
    }

    completeAssignments(yesterdayAssignments.map((assignment) => assignment.setupNumber));
  }, [assignments, setups]);

  const scheduledSetupNumbers = useMemo(
    () => new Set(assignments.map((assignment) => assignment.setupNumber)),
    [assignments],
  );

  const queueSetups = setups.filter(
    (setup) => !scheduledSetupNumbers.has(setup.setupNumber),
  );

  const selectedQueueSetup = setups.find(
    (setup) => setup.setupNumber === scheduleForm.setupNumber,
  );

  function updateScheduleForm(field: keyof ScheduleAssignment, value: string) {
    setScheduleForm((current) => {
      if (field === "setupNumber") {
        const matchingSetup = setups.find((setup) => setup.setupNumber === value);

        return {
          ...current,
          setupNumber: value,
          machine: matchingSetup?.machine || current.machine,
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  function saveAssignments(nextAssignments: ScheduleAssignment[]) {
    setAssignments(nextAssignments);
    window.localStorage.setItem(
      scheduleStorageKey,
      JSON.stringify(nextAssignments),
    );
  }

  function saveFinishedGoods(nextFinishedGoods: FinishedGood[]) {
    window.localStorage.setItem(
      finishedGoodsStorageKey,
      JSON.stringify(nextFinishedGoods),
    );
  }

  function scheduleSelectedSetup() {
    if (!scheduleForm.setupNumber) {
      return;
    }

    const nextAssignment = {
      ...scheduleForm,
      machine: scheduleForm.machine || selectedQueueSetup?.machine || "96",
    };
    const nextAssignments = [
      ...assignments.filter(
        (assignment) => assignment.setupNumber !== nextAssignment.setupNumber,
      ),
      nextAssignment,
    ].sort((a, b) => {
      const dateCompare = a.scheduleDate.localeCompare(b.scheduleDate);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.startTime.localeCompare(b.startTime);
    });

    saveAssignments(nextAssignments);
    setScheduleForm((current) => ({
      ...current,
      setupNumber:
        queueSetups.find((setup) => setup.setupNumber !== current.setupNumber)
          ?.setupNumber ?? "",
      notes: "",
    }));
  }

  function removeFromSchedule(setupNumber: string) {
    saveAssignments(
      assignments.filter((assignment) => assignment.setupNumber !== setupNumber),
    );
  }

  function completeAssignments(setupNumbers: string[]) {
    const setupNumberSet = new Set(setupNumbers);
    const existingFinishedGoods = JSON.parse(
      window.localStorage.getItem(finishedGoodsStorageKey) ?? "[]",
    ) as FinishedGood[];
    const existingFinishedGoodIds = new Set(
      existingFinishedGoods.map((finishedGood) => finishedGood.id),
    );
    const newFinishedGoods = setupNumbers.flatMap((setupNumber) => {
      const setup = findSetup(setupNumber);
      const assignment = assignments.find(
        (currentAssignment) => currentAssignment.setupNumber === setupNumber,
      );

      if (!setup) {
        return [];
      }

      return buildFinishedGoods(
        setup,
        assignment?.scheduleDate || todayValue,
      ).filter((finishedGood) => !existingFinishedGoodIds.has(finishedGood.id));
    });
    const nextAssignments = assignments.map((assignment) =>
      setupNumberSet.has(assignment.setupNumber)
        ? {
            ...assignment,
            status: "Ready to Ship",
          }
        : assignment,
    );

    saveFinishedGoods([...existingFinishedGoods, ...newFinishedGoods]);
    saveAssignments(nextAssignments);
    syncScheduledSetupStatus(setupNumbers, "Ready to Ship");
  }

  function findSetup(setupNumber: string) {
    return setups.find((setup) => setup.setupNumber === setupNumber);
  }

  if (setups.length === 0) {
    return (
      <p className="mt-8 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-8 text-center text-zinc-400">
        No setups have been submitted for scheduling yet.
      </p>
    );
  }

  return (
    <>
      <section className="mt-8 rounded-md border border-zinc-800 bg-zinc-900 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.9fr_0.8fr_0.8fr_0.8fr]">
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Setup
            <select
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50"
              value={scheduleForm.setupNumber}
              onChange={(event) =>
                updateScheduleForm("setupNumber", event.target.value)
              }
            >
              <option value="">Choose setup</option>
              {queueSetups.map((setup) => (
                <option key={setup.setupNumber} value={setup.setupNumber}>
                  {setup.setupNumber} - {setup.salesMemos[0]?.customer || "No customer"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Date
            <input
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50"
              type="date"
              value={scheduleForm.scheduleDate}
              onChange={(event) =>
                updateScheduleForm("scheduleDate", event.target.value)
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Start
            <input
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50"
              type="time"
              value={scheduleForm.startTime}
              onChange={(event) =>
                updateScheduleForm("startTime", event.target.value)
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Shift
            <select
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50"
              value={scheduleForm.shift}
              onChange={(event) => updateScheduleForm("shift", event.target.value)}
            >
              <option>1st Shift</option>
              <option>2nd Shift</option>
              <option>Weekend</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Priority
            <select
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50"
              value={scheduleForm.priority}
              onChange={(event) =>
                updateScheduleForm("priority", event.target.value)
              }
            >
              <option>Normal</option>
              <option>Rush</option>
              <option>Hold</option>
            </select>
          </label>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[0.7fr_1fr_auto]">
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Machine
            <input
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50"
              value={scheduleForm.machine}
              onChange={(event) =>
                updateScheduleForm("machine", event.target.value)
              }
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Notes
            <input
              className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50"
              placeholder="Optional schedule note"
              value={scheduleForm.notes}
              onChange={(event) => updateScheduleForm("notes", event.target.value)}
            />
          </label>
          <button
            className="self-end rounded border border-cyan-400 bg-cyan-300 px-5 py-2 font-bold text-zinc-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-700 disabled:text-zinc-400"
            type="button"
            disabled={!scheduleForm.setupNumber}
            onClick={scheduleSelectedSetup}
          >
            Add to Schedule
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-zinc-800 bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-xl font-bold">Scheduled Jobs</h2>
          <span className="text-sm text-zinc-400">{assignments.length} scheduled</span>
        </div>
        <div className="max-h-[330px] overflow-auto">
          {assignments.length > 0 ? (
            <table className="w-full min-w-[980px] border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-900 text-zinc-300">
                <tr>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Time</th>
                  <th className="px-2 py-2">Shift</th>
                  <th className="px-2 py-2">Setup</th>
                  <th className="px-2 py-2">Customer / SM</th>
                  <th className="px-2 py-2">Machine</th>
                  <th className="px-2 py-2">Priority</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Notes</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {assignments.map((assignment) => {
                  const setup = findSetup(assignment.setupNumber);

                  return (
                    <tr key={assignment.setupNumber} className="align-top">
                      <td className="px-2 py-2 font-bold">
                        {assignment.scheduleDate || "-"}
                      </td>
                      <td className="px-2 py-2">{assignment.startTime || "-"}</td>
                      <td className="px-2 py-2">{assignment.shift || "-"}</td>
                      <td className="px-2 py-2">
                        <button
                          className="font-bold text-cyan-300 underline-offset-4 hover:underline"
                          type="button"
                          onClick={() => setup && setSelectedSetup(setup)}
                        >
                          {assignment.setupNumber}
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        {setup?.salesMemos.length
                          ? setup.salesMemos
                              .map(
                                (memo) =>
                                  `${memo.customer || "Customer"} / ${memo.memoNumber}`,
                              )
                              .join(", ")
                          : "-"}
                      </td>
                      <td className="px-2 py-2">{assignment.machine || "-"}</td>
                      <td className="px-2 py-2">{assignment.priority || "-"}</td>
                      <td className="px-2 py-2">
                        <span
                          className={
                            assignment.status === "Ready to Ship"
                              ? "rounded bg-emerald-300 px-2 py-1 text-xs font-bold text-zinc-950"
                              : "rounded bg-cyan-300 px-2 py-1 text-xs font-bold text-zinc-950"
                          }
                        >
                          {assignment.status || "Scheduled"}
                        </span>
                      </td>
                      <td className="px-2 py-2">{assignment.notes || "-"}</td>
                      <td className="flex gap-2 px-2 py-2">
                        {assignment.status !== "Ready to Ship" ? (
                          <button
                            className="rounded border border-emerald-500 px-2 py-1 font-semibold text-emerald-300 hover:bg-emerald-950"
                            type="button"
                            onClick={() =>
                              completeAssignments([assignment.setupNumber])
                            }
                          >
                            Complete
                          </button>
                        ) : null}
                        <button
                          className="rounded border border-zinc-700 px-2 py-1 font-semibold hover:bg-zinc-800"
                          type="button"
                          onClick={() => removeFromSchedule(assignment.setupNumber)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-8 text-center text-zinc-400">
              No jobs are on the schedule yet.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Queue</h2>
        <div className="mt-3 max-h-[320px] overflow-auto rounded-md border border-zinc-800">
          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-zinc-900 text-zinc-300">
              <tr>
                <th className="px-2 py-2">Setup</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Machine</th>
                <th className="px-2 py-2">Gauge</th>
                <th className="px-2 py-2">Finish</th>
                <th className="px-2 py-2">Coils</th>
                <th className="px-2 py-2">SMs</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {queueSetups.map((setup) => (
                <tr key={setup.setupNumber} className="bg-zinc-950 align-top">
                  <td className="px-2 py-2">
                    <button
                      className="font-bold text-cyan-300 underline-offset-4 hover:underline"
                      type="button"
                      onClick={() => setSelectedSetup(setup)}
                    >
                      {setup.setupNumber}
                    </button>
                  </td>
                  <td className="px-2 py-2">{setup.dateApplied || "-"}</td>
                  <td className="px-2 py-2">{setup.machine || "-"}</td>
                  <td className="px-2 py-2">{setup.gauge || "-"}</td>
                  <td className="px-2 py-2">{setup.finish || "-"}</td>
                  <td className="px-2 py-2">
                    {setup.coils.length > 0
                      ? setup.coils
                          .map(
                            (coil) =>
                              `${coil.coilNumber} (${coil.cutWidth || "-"}\")`,
                          )
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="px-2 py-2">
                    {setup.salesMemos.length > 0
                      ? setup.salesMemos
                          .map((memo) => `${memo.memoNumber} ${memo.width || "-"}\"`)
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="px-2 py-2">
                    <span className="rounded bg-amber-300 px-2 py-1 text-xs font-bold text-zinc-950">
                      {setup.status ?? "Ready to schedule"}
                    </span>
                  </td>
                </tr>
              ))}
              {queueSetups.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-zinc-400" colSpan={8}>
                    Every setup in the queue has been placed on the schedule.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedSetup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-50 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 p-5">
              <div>
                <h2 className="text-2xl font-bold">
                  Setup {selectedSetup.setupNumber}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Machine {selectedSetup.machine || "-"} | {selectedSetup.gauge || "-"} |{" "}
                  {selectedSetup.finish || "-"}
                </p>
              </div>
              <button
                className="rounded-md border border-zinc-700 px-3 py-2 font-semibold hover:bg-zinc-800"
                type="button"
                onClick={() => setSelectedSetup(null)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 p-5">
              <section className="grid gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-4 text-sm sm:grid-cols-4">
                <p>
                  <span className="text-zinc-400">Date</span>
                  <br />
                  <strong>{selectedSetup.dateApplied || "-"}</strong>
                </p>
                <p>
                  <span className="text-zinc-400">Applier</span>
                  <br />
                  <strong>{selectedSetup.applier || "-"}</strong>
                </p>
                <p>
                  <span className="text-zinc-400">Submitted</span>
                  <br />
                  <strong>
                    {selectedSetup.submittedAt
                      ? new Date(selectedSetup.submittedAt).toLocaleString()
                      : "-"}
                  </strong>
                </p>
                <p>
                  <span className="text-zinc-400">Status</span>
                  <br />
                  <strong>{selectedSetup.status ?? "Ready to schedule"}</strong>
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold">Coils</h3>
                <div className="mt-3 overflow-auto rounded-md border border-zinc-800">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead className="bg-zinc-900 text-zinc-300">
                      <tr>
                        <th className="px-3 py-2">Coil</th>
                        <th className="px-3 py-2">Width</th>
                        <th className="px-3 py-2">Weight</th>
                        <th className="px-3 py-2">Cut Width</th>
                        <th className="px-3 py-2">Breaks</th>
                        <th className="px-3 py-2">Calc OD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {selectedSetup.coils.map((coil) => (
                        <tr key={coil.coilNumber}>
                          <td className="px-3 py-2 font-bold text-cyan-300">
                            {coil.coilNumber}
                          </td>
                          <td className="px-3 py-2">{coil.width || "-"}</td>
                          <td className="px-3 py-2">{coil.weight || "-"}</td>
                          <td className="px-3 py-2">{coil.cutWidth || "-"}</td>
                          <td className="px-3 py-2">{coil.breaks || "-"}</td>
                          <td className="px-3 py-2">{coil.calcOd || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold">Sales Memos</h3>
                <div className="mt-3 overflow-auto rounded-md border border-zinc-800">
                  <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                    <thead className="bg-zinc-900 text-zinc-300">
                      <tr>
                        <th className="px-3 py-2">SM #</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Width</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {selectedSetup.salesMemos.map((memo) => (
                        <tr key={memo.memoNumber}>
                          <td className="px-3 py-2 font-bold text-cyan-300">
                            {memo.memoNumber}
                          </td>
                          <td className="px-3 py-2">{memo.customer || "-"}</td>
                          <td className="px-3 py-2">{memo.width || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
