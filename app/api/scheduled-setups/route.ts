import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type ScheduledSetupPayload = {
  setupNumber?: string;
  dateApplied?: string;
  applier?: string;
  machine?: string;
  gauge?: string;
  finish?: string;
  coils?: unknown;
  salesMemos?: unknown;
};

type ScheduledSetupStatusPayload = {
  setupNumbers?: string[];
  status?: string;
};

type SetupCoil = {
  coilNumber?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as ScheduledSetupPayload;

  if (!payload.setupNumber) {
    return NextResponse.json(
      { message: "Setup number is required." },
      { status: 400 },
    );
  }

  const scheduledSetup = await prisma.scheduledSetup.upsert({
    where: {
      setupNumber: payload.setupNumber,
    },
    create: {
      setupNumber: payload.setupNumber,
      dateApplied: payload.dateApplied ?? "",
      applier: payload.applier ?? "",
      machine: payload.machine ?? "96",
      gauge: payload.gauge ?? "",
      finish: payload.finish ?? "",
      status: "Scheduled",
      coils: payload.coils ?? [],
      salesMemos: payload.salesMemos ?? [],
    },
    update: {
      dateApplied: payload.dateApplied ?? "",
      applier: payload.applier ?? "",
      machine: payload.machine ?? "96",
      gauge: payload.gauge ?? "",
      finish: payload.finish ?? "",
      status: "Scheduled",
      coils: payload.coils ?? [],
      salesMemos: payload.salesMemos ?? [],
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ scheduledSetup });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as ScheduledSetupStatusPayload;
  const setupNumbers = payload.setupNumbers?.filter(Boolean) ?? [];
  const status = payload.status?.trim();

  if (setupNumbers.length === 0 || !status) {
    return NextResponse.json(
      { message: "Setup numbers and status are required." },
      { status: 400 },
    );
  }

  const updateResult = await prisma.scheduledSetup.updateMany({
    where: {
      setupNumber: {
        in: setupNumbers,
      },
    },
    data: {
      status,
    },
  });
  let slitCoils = 0;

  if (status === "Ready to Ship") {
    const completedSetups = await prisma.scheduledSetup.findMany({
      where: {
        setupNumber: {
          in: setupNumbers,
        },
      },
      select: {
        coils: true,
      },
    });
    const coilNumbers = [
      ...new Set(
        completedSetups.flatMap((setup) => {
          const setupCoils = Array.isArray(setup.coils)
            ? (setup.coils as SetupCoil[])
            : [];

          return setupCoils
            .map((coil) => coil.coilNumber)
            .filter((coilNumber): coilNumber is string => Boolean(coilNumber));
        }),
      ),
    ];

    if (coilNumbers.length > 0) {
      const coilUpdateResult = await prisma.masterCoil.updateMany({
        where: {
          coilNumber: {
            in: coilNumbers,
          },
        },
        data: {
          status: "Slit",
        },
      });

      slitCoils = coilUpdateResult.count;
    }
  }

  return NextResponse.json({ updated: updateResult.count, slitCoils });
}
