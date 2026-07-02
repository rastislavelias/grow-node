import { telemetryPayloadSchema, type ZoneStatus } from '@grow-node/contracts'
import { db, ZoneStatus as DbZoneStatus } from '@grow-node/db'

import {
  evaluateZone,
  type ZoneDecision,
} from '../../decision/evaluate-zone.js'
import { parseJson } from '../../utils/parse-json.js'

function toDbZoneStatus(status: ZoneStatus): DbZoneStatus {
  switch (status) {
    case 'normal':
      return DbZoneStatus.NORMAL
    case 'warning':
      return DbZoneStatus.WARNING
    case 'critical':
      return DbZoneStatus.CRITICAL
  }
}

async function updateZoneState(
  zoneId: string,
  decision: ZoneDecision,
  recordedAt: Date,
) {
  await db.zoneState.upsert({
    where: {
      zoneId,
    },
    update: {
      status: toDbZoneStatus(decision.status),
      fanDesired: decision.fanDesired,
      lightDesired: decision.lightDesired,
      lastTelemetryAt: recordedAt,
      lastEvaluatedAt: new Date(),
    },
    create: {
      zoneId,
      status: toDbZoneStatus(decision.status),
      fanDesired: decision.fanDesired,
      lightDesired: decision.lightDesired,
      lastTelemetryAt: recordedAt,
      lastEvaluatedAt: new Date(),
    },
  })
}

export async function handleTelemetryMessage(message: Buffer) {
  const parsedJson = parseJson(message)
  const result = telemetryPayloadSchema.safeParse(parsedJson)

  if (!result.success) {
    console.error('Invalid telemetry payload', result.error.flatten())
    return
  }

  const telemetry = result.data

  const zone = await db.zone.findUnique({
    where: {
      id: telemetry.zoneId,
    },
    include: {
      plantProfile: true,
    },
  })

  if (!zone) {
    console.warn(`Telemetry received for unknown zone: ${telemetry.zoneId}`)
    return
  }

  const device = await db.device.findUnique({
    where: {
      id: telemetry.deviceId,
    },
  })

  if (!device) {
    console.warn(`Telemetry received for unknown device: ${telemetry.deviceId}`)
    return
  }

  const recordedAt = new Date(telemetry.recordedAt)

  await db.telemetryReading.create({
    data: {
      zoneId: telemetry.zoneId,
      deviceId: telemetry.deviceId,
      recordedAt,
      temperatureC: telemetry.temperatureC,
      humidityPct: telemetry.humidityPct,
      lightLux: telemetry.lightLux,
    },
  })

  await db.device.update({
    where: {
      id: telemetry.deviceId,
    },
    data: {
      lastSeenAt: recordedAt,
    },
  })

  const decision = evaluateZone(telemetry, zone.plantProfile)

  await updateZoneState(telemetry.zoneId, decision, recordedAt)

  console.log('Stored telemetry and updated zone state', {
    zoneId: telemetry.zoneId,
    deviceId: telemetry.deviceId,
    status: decision.status,
    fanDesired: decision.fanDesired,
    lightDesired: decision.lightDesired,
  })
}
