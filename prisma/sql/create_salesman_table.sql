CREATE TABLE IF NOT EXISTS "Salesman" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Salesman" ("id", "name")
SELECT gen_random_uuid()::text, "Salesman"
FROM (
  SELECT DISTINCT "Salesman"
  FROM "Customers"
  WHERE "Salesman" IS NOT NULL AND "Salesman" <> ''
) existing_salesmen
ON CONFLICT ("name") DO NOTHING;
