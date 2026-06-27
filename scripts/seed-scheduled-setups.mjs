import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const steelWeightFactor = 0.2223;
const insideDiameter = 20;
const setupCount = 50;

function cleanSpec(value) {
  return String(value ?? "").trim().toLowerCase();
}

function gaugesMatch(coilGauge, memoGauge) {
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

function formatsMatch(coilValue, memoValue) {
  return !memoValue || cleanSpec(coilValue) === cleanSpec(memoValue);
}

function formatDecimal(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function formatWeight(value) {
  return Math.round(value).toLocaleString();
}

function calculateOd(coilWeight, coilWidth, breaks) {
  const pieces = breaks + 1;
  const coilArea = coilWeight / (steelWeightFactor * coilWidth);
  return Math.sqrt(coilArea / pieces + insideDiameter ** 2);
}

function setupDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

function chooseStockWidth(memoWidth, index) {
  const stockWidths = [48, 48.062, 50, 56.25, 60, 62.375, 72];
  const matchingWidth = stockWidths.find((width) => width >= memoWidth);
  return matchingWidth ?? Math.ceil(memoWidth + 10 + (index % 4) * 2);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

try {
  const salesMemoResult = await client.query(`
    SELECT
      sm.id,
      sm."memoNumber",
      sm.salesman,
      sm.grade,
      sm.finish,
      sm.gauge::text AS gauge,
      sm.width::text AS width,
      sm.weight,
      sm."dueDate",
      sm.status,
      sm.notes,
      c."Customer Number" AS "customerNumber",
      c."Customer Name" AS "customerName"
    FROM "SalesMemo" sm
    JOIN "Customers" c ON c."ID" = sm."customerId"
    ORDER BY sm."dueDate" ASC NULLS LAST, sm."memoNumber" ASC
  `);

  if (salesMemoResult.rows.length === 0) {
    throw new Error("No sales memos found. Add sales memos before seeding setups.");
  }

  const coilsResult = await client.query(`
    SELECT
      "ID"::text AS id,
      "Coil Number" AS "coilNumber",
      "Grade" AS grade,
      "Width"::text AS width,
      "Weight" AS weight,
      "Status" AS status,
      "Location" AS location,
      "Gauge"::text AS gauge,
      "Supplier" AS supplier,
      "Finish" AS finish
    FROM "Inventory"
    ORDER BY "Coil Number" ASC
  `);

  const maxInventoryIdResult = await client.query(`
    SELECT COALESCE(MAX("ID"), 1000) AS "maxId" FROM "Inventory"
  `);
  let nextInventoryId = Number(maxInventoryIdResult.rows[0].maxId) + 1;
  const coils = [...coilsResult.rows];

  const maxSetupNumberResult = await client.query(`
    SELECT COALESCE(MAX(number_part), 99) AS "maxSetupNumber"
    FROM (
      SELECT NULLIF(REGEXP_REPLACE("setupNumber", '[^0-9]', '', 'g'), '')::int AS number_part
      FROM "Setups"
      UNION ALL
      SELECT NULLIF(REGEXP_REPLACE("setupNumber", '[^0-9]', '', 'g'), '')::int AS number_part
      FROM "ScheduledSetup"
    ) setup_numbers
  `);
  let nextSetupNumber = Number(maxSetupNumberResult.rows[0].maxSetupNumber) + 1;

  const scheduledSetups = [];
  let addedCoils = 0;

  for (let index = 0; index < setupCount; index += 1) {
    const memo = salesMemoResult.rows[index % salesMemoResult.rows.length];
    const memoWidth = Number(memo.width);
    const matchingCoil =
      coils.find((coil) => {
        const coilWidth = Number(coil.width);
        return (
          formatsMatch(coil.grade, memo.grade) &&
          formatsMatch(coil.finish, memo.finish) &&
          gaugesMatch(coil.gauge, memo.gauge) &&
          coilWidth >= memoWidth
        );
      }) ?? null;

    let coil = matchingCoil;

    if (!coil) {
      const coilWidth = chooseStockWidth(memoWidth, index);
      const coilWeight = 9000 + ((index * 1379) % 23000);
      const coilNumber = `COIL-${nextInventoryId}`;

      await client.query(
        `
        INSERT INTO "Inventory"
          ("ID", "Coil Number", "Grade", "Width", "Weight", "Status", "Location", "Gauge", "Supplier", "Finish")
        VALUES
          ($1, $2, $3, $4, $5, 'Stock', 'Seed Rack', $6, 'Seed Steel', $7)
        ON CONFLICT ("Coil Number") DO NOTHING
        `,
        [
          nextInventoryId,
          coilNumber,
          memo.grade,
          coilWidth,
          coilWeight,
          memo.gauge,
          memo.finish,
        ],
      );

      coil = {
        id: String(nextInventoryId),
        coilNumber,
        grade: memo.grade,
        width: String(coilWidth),
        weight: coilWeight,
        status: "Stock",
        location: "Seed Rack",
        gauge: memo.gauge,
        supplier: "Seed Steel",
        finish: memo.finish,
      };
      coils.push(coil);
      nextInventoryId += 1;
      addedCoils += 1;
    }

    const breaks = index % 3;
    const pieces = breaks + 1;
    const cuts = Math.max(1, Math.floor(Number(coil.width) / memoWidth));
    const plugWeight = (Number(coil.weight) * memoWidth) / Number(coil.width) / pieces;
    const totalPlugs = cuts * pieces;
    const setupNumber = `S${nextSetupNumber}`;
    const salesMemo = {
      memoNumber: memo.memoNumber,
      customer: `${memo.customerNumber} - ${memo.customerName ?? ""}`,
      width: formatDecimal(memoWidth),
    };
    const setupCoil = {
      coilNumber: coil.coilNumber,
      width: formatDecimal(Number(coil.width)),
      weight: formatWeight(Number(coil.weight)),
      cutWidth: formatDecimal(memoWidth * cuts),
      breaks: String(breaks),
      calcOd: formatDecimal(calculateOd(Number(coil.weight), Number(coil.width), breaks)),
    };

    await client.query(
      `
      INSERT INTO "Setups" ("setupNumber")
      VALUES ($1)
      ON CONFLICT ("setupNumber") DO NOTHING
      `,
      [setupNumber],
    );

    await client.query(
      `
      INSERT INTO "ScheduledSetup"
        ("id", "setupNumber", "dateApplied", "applier", "machine", "gauge", "finish", "status", "submittedAt", "coils", "salesMemos")
      VALUES
        ($1, $2, $3, $4, '96', $5, $6, 'Ready to schedule', NOW(), $7::jsonb, $8::jsonb)
      ON CONFLICT ("setupNumber") DO UPDATE SET
        "dateApplied" = EXCLUDED."dateApplied",
        "applier" = EXCLUDED."applier",
        "machine" = EXCLUDED."machine",
        "gauge" = EXCLUDED."gauge",
        "finish" = EXCLUDED."finish",
        "status" = EXCLUDED."status",
        "submittedAt" = EXCLUDED."submittedAt",
        "coils" = EXCLUDED."coils",
        "salesMemos" = EXCLUDED."salesMemos"
      `,
      [
        `seed_${setupNumber}`,
        setupNumber,
        setupDate(),
        "Seed",
        memo.gauge,
        memo.finish,
        JSON.stringify([setupCoil]),
        JSON.stringify([salesMemo]),
      ],
    );

    scheduledSetups.push(setupNumber);
    nextSetupNumber += 1;
  }

  console.log(
    `Created ${scheduledSetups.length} scheduled setups (${scheduledSetups[0]}-${scheduledSetups.at(-1)}). Added ${addedCoils} matching coils.`,
  );
} finally {
  await client.end();
}
