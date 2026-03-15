-- CreateTable
CREATE TABLE "ProductionDailyEntry" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "plantId" INTEGER NOT NULL,
    "volumeKhsPdw" DOUBLE PRECISION,
    "volumeKronesCsd" DOUBLE PRECISION,
    "volumeTetra" DOUBLE PRECISION,
    "meKhsPdw" DOUBLE PRECISION,
    "meKronesCsd" DOUBLE PRECISION,
    "meTetra" DOUBLE PRECISION,
    "downtimeKhsPdw" DOUBLE PRECISION,
    "downtimeKronesCsd" DOUBLE PRECISION,
    "downtimeTetra" DOUBLE PRECISION,
    "preformYieldKhsPdw" DOUBLE PRECISION,
    "preformYieldKronesCsd" DOUBLE PRECISION,
    "closureYieldKhsPdw" DOUBLE PRECISION,
    "closureYieldKronesCsd" DOUBLE PRECISION,
    "totalCpvFinishing" DOUBLE PRECISION,
    "co2YieldPlant" DOUBLE PRECISION,
    "openPoKhsPdw" INTEGER,
    "openPoKronesCsd" INTEGER,
    "openPoTetra" INTEGER,
    "next24hrsPlan" TEXT,
    "criticalIssues" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionDailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QseDailyEntry" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "plantId" INTEGER NOT NULL,
    "tbtCompliance" DOUBLE PRECISION,
    "bbsPercent" DOUBLE PRECISION,
    "ucUaPercent" DOUBLE PRECISION,
    "nearMissSifis" INTEGER,
    "criticalSafetyIssue" TEXT,
    "waterUsageRatio" DOUBLE PRECISION,
    "concentrateYield" DOUBLE PRECISION,
    "sugarYield" DOUBLE PRECISION,
    "pulpYield" DOUBLE PRECISION,
    "totalRawSyrup" DOUBLE PRECISION,
    "numCips" INTEGER,
    "criticalQualityIssue" TEXT,
    "etpDischarge" DOUBLE PRECISION,
    "etpInlet" DOUBLE PRECISION,
    "etpRoDischarge" DOUBLE PRECISION,
    "stpDischarge" DOUBLE PRECISION,
    "criticalEnvIssue" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QseDailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceDailyEntry" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "plantId" INTEGER NOT NULL,
    "breakdownCount" INTEGER,
    "pmCompliance" DOUBLE PRECISION,
    "criticalIssue" TEXT,
    "remarks" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceDailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrDailyEntry" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "plantId" INTEGER NOT NULL,
    "manpowerProductivity" DOUBLE PRECISION,
    "totalOpenPosition" INTEGER,
    "criticalHrIssue" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrDailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoresDailyEntry" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "plantId" INTEGER NOT NULL,
    "remarks" TEXT,
    "criticalIssue" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoresDailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionDailyEntry_date_plantId_key" ON "ProductionDailyEntry"("date", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "QseDailyEntry_date_plantId_key" ON "QseDailyEntry"("date", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceDailyEntry_date_plantId_key" ON "MaintenanceDailyEntry"("date", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "HrDailyEntry_date_plantId_key" ON "HrDailyEntry"("date", "plantId");

-- CreateIndex
CREATE UNIQUE INDEX "StoresDailyEntry_date_plantId_key" ON "StoresDailyEntry"("date", "plantId");

-- AddForeignKey
ALTER TABLE "ProductionDailyEntry" ADD CONSTRAINT "ProductionDailyEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QseDailyEntry" ADD CONSTRAINT "QseDailyEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceDailyEntry" ADD CONSTRAINT "MaintenanceDailyEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrDailyEntry" ADD CONSTRAINT "HrDailyEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoresDailyEntry" ADD CONSTRAINT "StoresDailyEntry_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
