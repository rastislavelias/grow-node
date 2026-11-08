import { ControllerType, db, ZonePhase, ZoneStatus } from '../src/index.js'

const anubiasPhaseConfig = {
  lightOn: {
    condensationMargin: {
      lowRiskMin: 1.5,
      mediumRiskMin: 0.5,
      scale: [0, 5],
      settleMinutes: 60,
    },
    estimatedPpfd: {
      optimal: [30, 75],
      warning: [13, 115],
      settleMinutes: 0,
    },
    humidity: {
      optimal: [88, 95],
      warning: [80, 98],
      settleMinutes: 50,
    },
    illuminance: {
      optimal: [1800, 4500],
      warning: [800, 7000],
      settleMinutes: 0,
    },
    temperature: {
      optimal: [22, 26],
      warning: [20, 28],
      settleMinutes: 35,
    },
    vpd: {
      optimal: [0.15, 0.4],
      warning: [0.08, 0.65],
      scale: [0, 0.78],
      settleMinutes: 50,
    },
  },
  lightOff: {
    condensationMargin: {
      lowRiskMin: 1,
      mediumRiskMin: 0.3,
      scale: [0, 3],
      settleMinutes: 90,
    },
    estimatedPpfd: {
      optimal: [0, 0.2],
      warning: [0, 1],
      settleMinutes: 0,
    },
    humidity: {
      optimal: [90, 97],
      warning: [85, 99],
      settleMinutes: 90,
    },
    illuminance: {
      optimal: [0, 10],
      warning: [0, 50],
      settleMinutes: 0,
    },
    temperature: {
      optimal: [20, 24],
      warning: [18, 26],
      settleMinutes: 60,
    },
    vpd: {
      optimal: [0.08, 0.3],
      warning: [0.03, 0.5],
      scale: [0, 0.6],
      settleMinutes: 90,
    },
  },
}

async function upsertZone({
  zoneId,
  zoneName,
  controllerType,
  controllerFirmwareVersion,
  plantProfileId,
}: {
  zoneId: string
  zoneName: string
  controllerType: ControllerType
  controllerFirmwareVersion: string
  plantProfileId: string
}) {
  const zone = await db.zone.upsert({
    where: {
      id: zoneId,
    },
    update: {
      name: zoneName,
      plantProfileId,
      controllerType,
      controllerFirmwareVersion,
    },
    create: {
      id: zoneId,
      name: zoneName,
      plantProfileId,
      controllerType,
      controllerFirmwareVersion,
    },
  })

  await db.zoneState.upsert({
    where: {
      zoneId: zone.id,
    },
    update: {
      status: ZoneStatus.NORMAL,
      activePhase: ZonePhase.LIGHT_OFF,
      fanDesired: false,
      lightDesired: false,
      heaterDesired: false,
      reasons: [],
    },
    create: {
      zoneId: zone.id,
      status: ZoneStatus.NORMAL,
      activePhase: ZonePhase.LIGHT_OFF,
      fanDesired: false,
      lightDesired: false,
      heaterDesired: false,
      reasons: [],
    },
  })
}

async function main() {
  const plantProfile = await db.plantProfile.upsert({
    where: {
      name: "Anubias barteri 'Petite'",
    },
    update: {
      scheduleStartMinutes: 21 * 60,
      scheduleDurationMinutes: 8 * 60,
      phaseConfig: anubiasPhaseConfig,
    },
    create: {
      name: "Anubias barteri 'Petite'",
      scheduleStartMinutes: 21 * 60,
      scheduleDurationMinutes: 8 * 60,
      phaseConfig: anubiasPhaseConfig,
    },
  })

  await upsertZone({
    zoneId: 'zone-1',
    zoneName: 'Anubias Zone 1',
    controllerType: ControllerType.SIMULATOR,
    controllerFirmwareVersion: 'simulator-0.1.0',
    plantProfileId: plantProfile.id,
  })

  console.log('Seed data created')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
