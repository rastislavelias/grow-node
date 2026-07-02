/*
  Warnings:

  - You are about to drop the column `maxSoilMoisturePct` on the `PlantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `minSoilMoisturePct` on the `PlantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `soilMoisturePct` on the `TelemetryReading` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlantProfile" DROP COLUMN "maxSoilMoisturePct",
DROP COLUMN "minSoilMoisturePct";

-- AlterTable
ALTER TABLE "TelemetryReading" DROP COLUMN "soilMoisturePct";
