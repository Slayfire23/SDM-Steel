"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getNextSetupNumber() {
  const setups = await prisma.setup.findMany({
    select: {
      setupNumber: true,
    },
  });

  const highestSetupNumber = setups.reduce((highest, setup) => {
    const setupNumber = Number(setup.setupNumber.replace(/^S/i, ""));

    return Number.isFinite(setupNumber) ? Math.max(highest, setupNumber) : highest;
  }, 99);

  return `S${highestSetupNumber + 1}`;
}

export async function createNewSetup() {
  const setupNumber = await getNextSetupNumber();

  await prisma.setup.create({
    data: {
      setupNumber,
    },
  });

  redirect(`/setup?setupNumber=${setupNumber}`);
}
