/*
  Warnings:

  - You are about to drop the column `deviceId` on the `Command` table. All the data in the column will be lost.
  - You are about to drop the column `deviceId` on the `TelemetryReading` table. All the data in the column will be lost.
  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeviceHeartbeat` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `controllerType` to the `Zone` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ControllerType" AS ENUM ('ESP32', 'SIMULATOR');

-- CreateEnum
CREATE TYPE "ControllerStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- DropForeignKey
ALTER TABLE "Command" DROP CONSTRAINT "Command_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceHeartbeat" DROP CONSTRAINT "DeviceHeartbeat_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "TelemetryReading" DROP CONSTRAINT "TelemetryReading_deviceId_fkey";

-- DropIndex
DROP INDEX "Command_deviceId_createdAt_idx";

-- DropIndex
DROP INDEX "TelemetryReading_deviceId_recordedAt_idx";

-- AlterTable
ALTER TABLE "Command" DROP COLUMN "deviceId";

-- AlterTable
ALTER TABLE "TelemetryReading" DROP COLUMN "deviceId";

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "controllerFirmwareVersion" TEXT,
ADD COLUMN     "controllerLastSeenAt" TIMESTAMP(3),
ADD COLUMN     "controllerType" "ControllerType" NOT NULL;

-- DropTable
DROP TABLE "Device";

-- DropTable
DROP TABLE "DeviceHeartbeat";

-- DropEnum
DROP TYPE "DeviceStatus";

-- DropEnum
DROP TYPE "DeviceType";

-- CreateTable
CREATE TABLE "ControllerHeartbeat" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL,
    "status" "ControllerStatus" NOT NULL,
    "firmwareVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControllerHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ControllerHeartbeat_zoneId_seenAt_idx" ON "ControllerHeartbeat"("zoneId", "seenAt");

-- AddForeignKey
ALTER TABLE "ControllerHeartbeat" ADD CONSTRAINT "ControllerHeartbeat_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
