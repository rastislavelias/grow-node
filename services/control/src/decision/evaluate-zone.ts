import type { PhaseConfig, PhaseMetricsConfig } from '@grow-node/contracts'

export type EvaluationStatus = 'normal' | 'warning' | 'danger'
export type EvaluationPhase = 'lightOn' | 'lightOff'

type MetricName =
  | 'temperature'
  | 'humidity'
  | 'illuminance'
  | 'estimatedPpfd'
  | 'vpd'
  | 'condensationMargin'

type Direction = 'low' | 'high' | 'risk'

type MetricStatus = 'settling' | 'warning' | 'danger'

export type EvaluationReason = {
  metric: MetricName
  status: MetricStatus
  value: number
  direction: Direction
}

type TelemetryForEvaluation = {
  temperatureC: number
  humidityPct: number
  lightLux: number
  estimatedPpfd?: number | undefined
  vpdKpa?: number | undefined
  condensationMarginC?: number | undefined
  recordedAt: Date
}

type PlantProfileForEvaluation = {
  scheduleStartMinutes: number
  scheduleDurationMinutes: number
  phaseConfig: PhaseConfig
}

type EvaluateZoneInput = {
  telemetry: TelemetryForEvaluation
  plantProfile: PlantProfileForEvaluation
}

export type ZoneEvaluation = {
  status: EvaluationStatus
  activePhase: EvaluationPhase
  fanDesired: boolean
  lightDesired: boolean
  heaterDesired: boolean
  reasons: EvaluationReason[]
}

const minutesPerDay = 24 * 60

function getMinutesAfterMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export function getActivePhase({
  now,
  scheduleStartMinutes,
  scheduleDurationMinutes,
}: {
  now: Date
  scheduleStartMinutes: number
  scheduleDurationMinutes: number
}): EvaluationPhase {
  if (scheduleDurationMinutes >= minutesPerDay) {
    return 'lightOn'
  }

  const currentMinutes = getMinutesAfterMidnight(now)
  const scheduleEndMinutes =
    (scheduleStartMinutes + scheduleDurationMinutes) % minutesPerDay

  const doesScheduleCrossMidnight =
    scheduleStartMinutes + scheduleDurationMinutes >= minutesPerDay

  const isLightOn = doesScheduleCrossMidnight
    ? currentMinutes >= scheduleStartMinutes ||
      currentMinutes < scheduleEndMinutes
    : currentMinutes >= scheduleStartMinutes &&
      currentMinutes < scheduleEndMinutes

  return isLightOn ? 'lightOn' : 'lightOff'
}

function getMinutesSincePhaseStarted({
  now,
  activePhase,
  scheduleStartMinutes,
  scheduleDurationMinutes,
}: {
  now: Date
  activePhase: EvaluationPhase
  scheduleStartMinutes: number
  scheduleDurationMinutes: number
}): number {
  const currentMinutes = getMinutesAfterMidnight(now)

  if (activePhase === 'lightOn') {
    if (currentMinutes >= scheduleStartMinutes) {
      return currentMinutes - scheduleStartMinutes
    }

    return minutesPerDay - scheduleStartMinutes + currentMinutes
  }

  const lightOffStartMinutes =
    (scheduleStartMinutes + scheduleDurationMinutes) % minutesPerDay

  if (currentMinutes >= lightOffStartMinutes) {
    return currentMinutes - lightOffStartMinutes
  }

  return minutesPerDay - lightOffStartMinutes + currentMinutes
}

function evaluateRangeMetric({
  metric,
  value,
  optimal,
  warning,
  settleMinutes,
  minutesSincePhaseStarted,
}: {
  metric: MetricName
  value: number
  optimal: [number, number]
  warning: [number, number]
  settleMinutes: number
  minutesSincePhaseStarted: number
}): EvaluationReason | null {
  if (value >= optimal[0] && value <= optimal[1]) {
    return null
  }

  const direction: Direction = value < optimal[0] ? 'low' : 'high'

  if (value >= warning[0] && value <= warning[1]) {
    return {
      metric,
      status: minutesSincePhaseStarted < settleMinutes ? 'settling' : 'warning',
      value,
      direction,
    }
  }

  return {
    metric,
    status: 'danger',
    value,
    direction,
  }
}

function evaluateCondensationMargin({
  value,
  phaseConfig,
  minutesSincePhaseStarted,
}: {
  value: number | undefined
  phaseConfig: PhaseMetricsConfig
  minutesSincePhaseStarted: number
}): EvaluationReason | null {
  if (value === undefined) {
    return null
  }

  const config = phaseConfig.condensationMargin

  if (value >= config.lowRiskMin) {
    return null
  }

  if (value >= config.mediumRiskMin) {
    return {
      metric: 'condensationMargin',
      status:
        minutesSincePhaseStarted < config.settleMinutes
          ? 'settling'
          : 'warning',
      value,
      direction: 'risk',
    }
  }

  return {
    metric: 'condensationMargin',
    status: 'danger',
    value,
    direction: 'risk',
  }
}

function getOverallStatus(reasons: EvaluationReason[]): EvaluationStatus {
  if (reasons.some((reason) => reason.status === 'danger')) {
    return 'danger'
  }

  if (reasons.some((reason) => reason.status === 'warning')) {
    return 'warning'
  }

  return 'normal'
}

export function evaluateZone({
  telemetry,
  plantProfile,
}: EvaluateZoneInput): ZoneEvaluation {
  const activePhase = getActivePhase({
    now: telemetry.recordedAt,
    scheduleStartMinutes: plantProfile.scheduleStartMinutes,
    scheduleDurationMinutes: plantProfile.scheduleDurationMinutes,
  })

  const phaseConfig = plantProfile.phaseConfig[activePhase]

  const minutesSincePhaseStarted = getMinutesSincePhaseStarted({
    now: telemetry.recordedAt,
    activePhase,
    scheduleStartMinutes: plantProfile.scheduleStartMinutes,
    scheduleDurationMinutes: plantProfile.scheduleDurationMinutes,
  })

  const reasons = [
    evaluateRangeMetric({
      metric: 'temperature',
      value: telemetry.temperatureC,
      optimal: phaseConfig.temperature.optimal,
      warning: phaseConfig.temperature.warning,
      settleMinutes: phaseConfig.temperature.settleMinutes,
      minutesSincePhaseStarted,
    }),
    evaluateRangeMetric({
      metric: 'humidity',
      value: telemetry.humidityPct,
      optimal: phaseConfig.humidity.optimal,
      warning: phaseConfig.humidity.warning,
      settleMinutes: phaseConfig.humidity.settleMinutes,
      minutesSincePhaseStarted,
    }),
    evaluateRangeMetric({
      metric: 'illuminance',
      value: telemetry.lightLux,
      optimal: phaseConfig.illuminance.optimal,
      warning: phaseConfig.illuminance.warning,
      settleMinutes: phaseConfig.illuminance.settleMinutes,
      minutesSincePhaseStarted,
    }),
    telemetry.estimatedPpfd === undefined
      ? null
      : evaluateRangeMetric({
          metric: 'estimatedPpfd',
          value: telemetry.estimatedPpfd,
          optimal: phaseConfig.estimatedPpfd.optimal,
          warning: phaseConfig.estimatedPpfd.warning,
          settleMinutes: phaseConfig.estimatedPpfd.settleMinutes,
          minutesSincePhaseStarted,
        }),
    telemetry.vpdKpa === undefined
      ? null
      : evaluateRangeMetric({
          metric: 'vpd',
          value: telemetry.vpdKpa,
          optimal: phaseConfig.vpd.optimal,
          warning: phaseConfig.vpd.warning,
          settleMinutes: phaseConfig.vpd.settleMinutes,
          minutesSincePhaseStarted,
        }),
    evaluateCondensationMargin({
      value: telemetry.condensationMarginC,
      phaseConfig,
      minutesSincePhaseStarted,
    }),
  ].filter((reason): reason is EvaluationReason => reason !== null)

  const status = getOverallStatus(reasons)

  const fanDesired = reasons.some((reason) => {
    return (
      (reason.metric === 'temperature' && reason.direction === 'high') ||
      (reason.metric === 'humidity' && reason.direction === 'high') ||
      reason.metric === 'condensationMargin' ||
      (reason.metric === 'vpd' && reason.direction === 'low')
    )
  })

  const heaterDesired = reasons.some((reason) => {
    return reason.metric === 'temperature' && reason.direction === 'low'
  })

  return {
    status,
    activePhase,
    fanDesired,
    lightDesired: activePhase === 'lightOn',
    heaterDesired,
    reasons,
  }
}
