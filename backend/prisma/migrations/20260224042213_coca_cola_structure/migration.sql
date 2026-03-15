/*
  Warnings:

  - The values [EMPLOYEE,SUPERVISOR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Entry` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[empId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "EquipCategory" AS ENUM ('PRODUCTION', 'UTILITY', 'QUALITY');

-- CreateEnum
CREATE TYPE "DowntimeType" AS ENUM ('PLANNED', 'UNPLANNED');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('BOILER_PRESSURE', 'BOILER_TEMPERATURE', 'COMPRESSED_AIR', 'ELECTRICITY_KWH', 'WATER_M3', 'CHILLER_TEMP');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('HIGH_DOWNTIME', 'LOW_OEE', 'TARGET_MISSED', 'QUALITY_ALERT', 'UTILITY_ABNORMAL', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('OPERATOR', 'SHIFT_SUPERVISOR', 'PLANT_MANAGER', 'ADMIN', 'GLOBAL_ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR';
COMMIT;

-- DropForeignKey
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_userId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "plantId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contactNo" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "empId" TEXT,
ADD COLUMN     "isHR" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plantId" INTEGER,
ALTER COLUMN "role" SET DEFAULT 'OPERATOR',
ALTER COLUMN "department" DROP NOT NULL;

-- DropTable
DROP TABLE "Entry";

-- DropEnum
DROP TYPE "EntryStatus";

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Line" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plantId" INTEGER NOT NULL,
    "ratedSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lineId" INTEGER NOT NULL,
    "category" "EquipCategory" NOT NULL DEFAULT 'PRODUCTION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SKU" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "plantId" INTEGER NOT NULL,
    "sizeML" INTEGER,
    "packageType" TEXT,
    "ratedSpeed" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SKU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" "ShiftType" NOT NULL,
    "plantId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "skuId" INTEGER,
    "skuName" TEXT,
    "targetQty" INTEGER NOT NULL DEFAULT 0,
    "grossProduction" INTEGER NOT NULL DEFAULT 0,
    "goodQty" INTEGER NOT NULL DEFAULT 0,
    "rejectedQty" INTEGER NOT NULL DEFAULT 0,
    "shiftDuration" INTEGER NOT NULL DEFAULT 480,
    "plannedDowntime" INTEGER NOT NULL DEFAULT 0,
    "unplannedDowntime" INTEGER NOT NULL DEFAULT 0,
    "changeoverTime" INTEGER NOT NULL DEFAULT 0,
    "runTime" INTEGER NOT NULL DEFAULT 0,
    "oeeAvailability" DOUBLE PRECISION,
    "oeePerformance" DOUBLE PRECISION,
    "oeeQuality" DOUBLE PRECISION,
    "oeeScore" DOUBLE PRECISION,
    "status" "LogStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "userId" INTEGER NOT NULL,
    "reviewerId" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DowntimeLog" (
    "id" SERIAL NOT NULL,
    "shiftLogId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "type" "DowntimeType" NOT NULL,
    "durationMins" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DowntimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityLog" (
    "id" SERIAL NOT NULL,
    "shiftLogId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "skuId" INTEGER,
    "rejectQty" INTEGER NOT NULL,
    "rejectReason" TEXT NOT NULL,
    "rejectStage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeoverLog" (
    "id" SERIAL NOT NULL,
    "shiftLogId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "fromSkuId" INTEGER,
    "toSkuName" TEXT,
    "durationMins" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeoverLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityLog" (
    "id" SERIAL NOT NULL,
    "shiftLogId" INTEGER NOT NULL,
    "lineId" INTEGER NOT NULL,
    "utilityType" "UtilityType" NOT NULL,
    "reading" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "UtilityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "plantId" INTEGER NOT NULL,
    "userId" INTEGER,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_code_key" ON "Plant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Line_plantId_code_key" ON "Line"("plantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "SKU_plantId_code_key" ON "SKU"("plantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "User_empId_key" ON "User"("empId");

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SKU" ADD CONSTRAINT "SKU_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftLog" ADD CONSTRAINT "ShiftLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftLog" ADD CONSTRAINT "ShiftLog_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftLog" ADD CONSTRAINT "ShiftLog_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftLog" ADD CONSTRAINT "ShiftLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftLog" ADD CONSTRAINT "ShiftLog_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeLog" ADD CONSTRAINT "DowntimeLog_shiftLogId_fkey" FOREIGN KEY ("shiftLogId") REFERENCES "ShiftLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeLog" ADD CONSTRAINT "DowntimeLog_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DowntimeLog" ADD CONSTRAINT "DowntimeLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityLog" ADD CONSTRAINT "QualityLog_shiftLogId_fkey" FOREIGN KEY ("shiftLogId") REFERENCES "ShiftLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityLog" ADD CONSTRAINT "QualityLog_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityLog" ADD CONSTRAINT "QualityLog_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeoverLog" ADD CONSTRAINT "ChangeoverLog_shiftLogId_fkey" FOREIGN KEY ("shiftLogId") REFERENCES "ShiftLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeoverLog" ADD CONSTRAINT "ChangeoverLog_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeoverLog" ADD CONSTRAINT "ChangeoverLog_fromSkuId_fkey" FOREIGN KEY ("fromSkuId") REFERENCES "SKU"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityLog" ADD CONSTRAINT "UtilityLog_shiftLogId_fkey" FOREIGN KEY ("shiftLogId") REFERENCES "ShiftLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityLog" ADD CONSTRAINT "UtilityLog_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
