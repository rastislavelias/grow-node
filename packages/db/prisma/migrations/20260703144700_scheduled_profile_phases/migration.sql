/*
  Warnings:

  - The values [CRITICAL] on the enum `ZoneStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `maxHumidityPct` on the `PlantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `maxLightLux` on the `PlantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `maxTemperatureC` on the `PlantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `minHumidityPct` on the `PlantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `minLightLux` on the `PlantProfile` table. All the data in the column will be lost.
  - You are about to drop the column `minTemperatureC` on the `PlantProfile` table. All the data in the column will be lost.
  - Added the required column `phaseConfig` to the `PlantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduleDurationMinutes` to the `PlantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduleStartMinutes` to the `PlantProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ZonePhase" AS ENUM ('LIGHT_ON', 'LIGHT_OFF');

-- AlterEnum
BEGIN;
CREATE TYPE "ZoneStatus_new" AS ENUM ('NORMAL', 'WARNING', 'DANGER');
ALTER TABLE "public"."ZoneState" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ZoneState" ALTER COLUMN "status" TYPE "ZoneStatus_new" USING ("status"::text::"ZoneStatus_new");
ALTER TYPE "ZoneStatus" RENAME TO "ZoneStatus_old";
ALTER TYPE "ZoneStatus_new" RENAME TO "ZoneStatus";
DROP TYPE "public"."ZoneStatus_old";
ALTER TABLE "ZoneState" ALTER COLUMN "status" SET DEFAULT 'NORMAL';
COMMIT;

-- AlterTable
ALTER TABLE "PlantProfile" DROP COLUMN "maxHumidityPct",
DROP COLUMN "maxLightLux",
DROP COLUMN "maxTemperatureC",
DROP COLUMN "minHumidityPct",
DROP COLUMN "minLightLux",
DROP COLUMN "minTemperatureC",
ADD COLUMN     "phaseConfig" JSONB NOT NULL,
ADD COLUMN     "scheduleDurationMinutes" INTEGER NOT NULL,
ADD COLUMN     "scheduleStartMinutes" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TelemetryReading" ADD COLUMN     "condensationMarginC" DOUBLE PRECISION,
ADD COLUMN     "estimatedPpfd" DOUBLE PRECISION,
ADD COLUMN     "vpdKpa" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ZoneState" ADD COLUMN     "activePhase" "ZonePhase" NOT NULL DEFAULT 'LIGHT_OFF',
ADD COLUMN     "heaterDesired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reasons" JSONB;
