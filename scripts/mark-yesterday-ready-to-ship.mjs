import fs from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const env = fs.readFileSync(".env", "utf8");

for (const line of env.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);

  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
  }
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const setups = await prisma.scheduledSetup.findMany({
  orderBy: {
    submittedAt: "desc",
  },
  take: 10,
  select: {
    setupNumber: true,
    coils: true,
  },
});
const setupNumbers = setups.map((setup) => setup.setupNumber);
const coilNumbers = [
  ...new Set(
    setups.flatMap((setup) => {
      const coils = Array.isArray(setup.coils) ? setup.coils : [];

      return coils
        .map((coil) => coil.coilNumber)
        .filter((coilNumber) => Boolean(coilNumber));
    }),
  ),
];
const updateResult = await prisma.scheduledSetup.updateMany({
  where: {
    setupNumber: {
      in: setupNumbers,
    },
  },
  data: {
    status: "Ready to Ship",
  },
});
const coilUpdateResult =
  coilNumbers.length > 0
    ? await prisma.masterCoil.updateMany({
        where: {
          coilNumber: {
            in: coilNumbers,
          },
        },
        data: {
          status: "Slit",
        },
      })
    : { count: 0 };

console.log(
  JSON.stringify(
    {
      setupNumbers,
      coilNumbers,
      updated: updateResult.count,
      slitCoils: coilUpdateResult.count,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
