-- CreateTable
CREATE TABLE "MasterCoil" (
    "id" TEXT NOT NULL,
    "coilNumber" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterCoil_pkey" PRIMARY KEY ("id")
);
