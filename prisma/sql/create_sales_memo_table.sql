CREATE TABLE IF NOT EXISTS "SalesMemo" (
  "id" TEXT PRIMARY KEY,
  "memoNumber" TEXT UNIQUE NOT NULL,
  "customerId" UUID NOT NULL REFERENCES "Customers"("ID") ON DELETE CASCADE,
  "salesman" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "finish" TEXT NOT NULL,
  "gauge" DECIMAL,
  "width" DECIMAL NOT NULL,
  "weight" INTEGER NOT NULL,
  "dueDate" DATE,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SalesMemo_customerId_idx"
  ON "SalesMemo" ("customerId");

CREATE INDEX IF NOT EXISTS "SalesMemo_salesman_idx"
  ON "SalesMemo" ("salesman");
