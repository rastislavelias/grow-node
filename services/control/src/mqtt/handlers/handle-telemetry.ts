import { phaseConfigSchema, telemetryPayloadSchema } from '@grow-node/contracts'
import {
  db,
  ZonePhase as DbZonePhase,
  ZoneStatus as DbZoneStatus,
} from '@grow-node/db'

import { evaluateZone } from '../../decision/evaluate-zone.js'

const zoneStatusMap = {
  normal: DbZoneStatus.NORMAL,
  warning: DbZoneStatus.WARNING,
  danger: DbZoneStatus.DANGER,
} as const

const zonePhaseMap = {
  lightOn: DbZonePhase.LIGHT_ON,
  lightOff: DbZonePhase.LIGHT_OFF,
} as const

export async function handleTelemetryMessage(message: Buffer) {
  const payload = telemetryPayloadSchema.parse(JSON.parse(message.toString()))

  const zone = await db.zone.findUnique({
    where: {
      id: payload.zoneId,
    },
    include: {
      plantProfile: true,
    },
  })

  if (!zone) {
    console.warn(`Ignoring telemetry for unknown zone: ${payload.zoneId}`)
    return
  }

  const recordedAt = new Date(payload.recordedAt)

  await db.telemetryReading.create({
    data: {
      zoneId: payload.zoneId,
      recordedAt,
      temperatureC: payload.temperatureC,
      humidityPct: payload.humidityPct,
      lightLux: payload.lightLux,
      estimatedPpfd: payload.estimatedPpfd ?? null,
      vpdKpa: payload.vpdKpa ?? null,
      condensationMarginC: payload.condensationMarginC ?? null,
      rawPayload: JSON.parse(JSON.stringify(payload)),
    },
  })

  const phaseConfig = phaseConfigSchema.parse(zone.plantProfile.phaseConfig)

  const evaluation = evaluateZone({
    telemetry: {
      temperatureC: payload.temperatureC,
      humidityPct: payload.humidityPct,
      lightLux: payload.lightLux,
      estimatedPpfd: payload.estimatedPpfd,
      vpdKpa: payload.vpdKpa,
      condensationMarginC: payload.condensationMarginC,
      recordedAt,
    },
    plantProfile: {
      scheduleStartMinutes: zone.plantProfile.scheduleStartMinutes,
      scheduleDurationMinutes: zone.plantProfile.scheduleDurationMinutes,
      phaseConfig,
    },
  })

  await db.zoneState.upsert({
    where: {
      zoneId: payload.zoneId,
    },
    update: {
      status: zoneStatusMap[evaluation.status],
      activePhase: zonePhaseMap[evaluation.activePhase],
      fanDesired: evaluation.fanDesired,
      lightDesired: evaluation.lightDesired,
      heaterDesired: evaluation.heaterDesired,
      reasons: evaluation.reasons,
      lastTelemetryAt: recordedAt,
      lastEvaluatedAt: new Date(),
    },
    create: {
      zoneId: payload.zoneId,
      status: zoneStatusMap[evaluation.status],
      activePhase: zonePhaseMap[evaluation.activePhase],
      fanDesired: evaluation.fanDesired,
      lightDesired: evaluation.lightDesired,
      heaterDesired: evaluation.heaterDesired,
      reasons: evaluation.reasons,
      lastTelemetryAt: recordedAt,
      lastEvaluatedAt: new Date(),
    },
  })

  console.log(
    `Stored telemetry for ${payload.zoneId}: ${evaluation.status} / ${evaluation.activePhase}`,
  )
}
