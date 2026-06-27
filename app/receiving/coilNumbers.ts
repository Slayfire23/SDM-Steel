import { prisma } from "@/lib/prisma";

export async function getNextCoilId() {
  const coils = await prisma.masterCoil.findMany({
    select: {
      id: true,
    },
  });

  const highestNumericId = coils.reduce((highest, coil) => {
    const numericId = Number(coil.id.toString());
    return Number.isInteger(numericId) && numericId > highest
      ? numericId
      : highest;
  }, 1000);

  return String(highestNumericId + 1);
}

export async function getNextCoilNumber() {
  const id = await getNextCoilId();
  return `COIL-${id}`;
}
