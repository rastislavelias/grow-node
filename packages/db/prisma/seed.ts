import { db, DeviceType, ZoneStatus } from '../src/index.js'

async function main() {
  const plantProfile = await db.plantProfile.upsert({
    where: {
      name: 'Demo Basil',
    },
    update: {
      minTemperatureC: 18,
      maxTemperatureC: 28,
      minHumidityPct: 45,
      maxHumidityPct: 75,
      minLightLux: 200,
      maxLightLux: 900,
    },
    create: {
      name: 'Demo Basil',
      minTemperatureC: 18,
      maxTemperatureC: 28,
      minHumidityPct: 45,
      maxHumidityPct: 75,
      minLightLux: 200,
      maxLightLux: 900,
    },
  })

  const zone = await db.zone.upsert({
    where: {
      id: 'zone-1',
    },
    update: {
      name: 'Demo Zone 1',
      plantProfileId: plantProfile.id,
    },
    create: {
      id: 'zone-1',
      name: 'Demo Zone 1',
      plantProfileId: plantProfile.id,
    },
  })

  await db.device.upsert({
    where: {
      id: 'device-1',
    },
    update: {
      zoneId: zone.id,
      name: 'Simulator Device 1',
      type: DeviceType.SIMULATOR,
      firmwareVersion: 'simulator-0.1.0',
    },
    create: {
      id: 'device-1',
      zoneId: zone.id,
      name: 'Simulator Device 1',
      type: DeviceType.SIMULATOR,
      firmwareVersion: 'simulator-0.1.0',
    },
  })

  await db.zoneState.upsert({
    where: {
      zoneId: zone.id,
    },
    update: {
      status: ZoneStatus.NORMAL,
      fanDesired: false,
      lightDesired: false,
    },
    create: {
      zoneId: zone.id,
      status: ZoneStatus.NORMAL,
      fanDesired: false,
      lightDesired: false,
    },
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
