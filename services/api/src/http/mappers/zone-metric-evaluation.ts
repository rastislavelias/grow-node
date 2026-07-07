import {
  phaseConfigSchema,
  zoneStateReasonSchema,
  type MetricDirection,
  type MetricKey,
  type MetricState,
  type PhaseConfig,
  type ZoneMetricEvaluationView,
  type ZoneMetricView,
  type ZonePhase,
  type ZoneStateReason,
} from '@grow-node/contracts'

type LatestTelemetry = {
  temperatureC: number
  humidityPct: number
  lightLux: number
  estimatedPpfd: number | null
  vpdKpa: number | null
  condensationMarginC: number | null
} | null

type CreateZoneMetricEvaluationInput = {
  activePhase: ZonePhase
  phaseConfigValue: unknown
  latestTelemetry: LatestTelemetry
  reasonsValue: unknown
}

const metricLabels = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  illuminance: 'Light',
  estimatedPpfd: 'Estimated PPFD',
  vpd: 'VPD',
  condensationMargin: 'Condensation margin',
} satisfies Record<MetricKey, string>

const metricUnits = {
  temperature: '°C',
  humidity: '%',
  illuminance: 'lx',
  estimatedPpfd: 'μmol m⁻² s⁻¹',
  vpd: 'kPa',
  condensationMargin: '°C',
} satisfies Record<MetricKey, string>

const metricPrecision = {
  temperature: 1,
  humidity: 1,
  illuminance: 0,
  estimatedPpfd: 1,
  vpd: 2,
  condensationMargin: 1,
} satisfies Record<MetricKey, number>

function parseReasons(value: unknown): ZoneStateReason[] {
  const result = zoneStateReasonSchema.array().safeParse(value)

  if (!result.success) {
    return []
  }

  return result.data
}

function getReasonForMetric(
  reasons: ZoneStateReason[],
  key: MetricKey,
): ZoneStateReason | undefined {
  return reasons.find((reason) => reason.metric === key)
}

function getMetricState({
  value,
  reason,
}: {
  value: number | null
  reason: ZoneStateReason | undefined
}): MetricState {
  if (value === null) {
    return 'unknown'
  }

  return reason?.status ?? 'optimal'
}

function getMetricDirection(
  reason: ZoneStateReason | undefined,
): MetricDirection {
  return reason?.direction ?? null
}

function createRangeMetric({
  key,
  value,
  config,
  reason,
}: {
  key: Exclude<MetricKey, 'condensationMargin'>
  value: number | null
  config: PhaseConfig['lightOn']['temperature']
  reason: ZoneStateReason | undefined
}): ZoneMetricView {
  return {
    key,
    label: metricLabels[key],
    value,
    unit: metricUnits[key],
    precision: metricPrecision[key],
    state: getMetricState({ value, reason }),
    direction: getMetricDirection(reason),
    range: {
      kind: 'range',
      optimal: config.optimal,
      warning: config.warning,
      scale: config.scale ?? null,
      settleMinutes: config.settleMinutes,
    },
  }
}

function createCondensationMetric({
  value,
  config,
  reason,
}: {
  value: number | null
  config: PhaseConfig['lightOn']['condensationMargin']
  reason: ZoneStateReason | undefined
}): ZoneMetricView {
  return {
    key: 'condensationMargin',
    label: metricLabels.condensationMargin,
    value,
    unit: metricUnits.condensationMargin,
    precision: metricPrecision.condensationMargin,
    state: getMetricState({ value, reason }),
    direction: getMetricDirection(reason),
    range: {
      kind: 'risk',
      lowRiskMin: config.lowRiskMin,
      mediumRiskMin: config.mediumRiskMin,
      scale: config.scale,
      settleMinutes: config.settleMinutes,
    },
  }
}

export function createZoneMetricEvaluationView({
  activePhase,
  phaseConfigValue,
  latestTelemetry,
  reasonsValue,
}: CreateZoneMetricEvaluationInput): ZoneMetricEvaluationView {
  const phaseConfig = phaseConfigSchema.parse(phaseConfigValue)
  const phase = phaseConfig[activePhase]
  const reasons = parseReasons(reasonsValue)

  return {
    activePhase,
    metrics: [
      createRangeMetric({
        key: 'temperature',
        value: latestTelemetry?.temperatureC ?? null,
        config: phase.temperature,
        reason: getReasonForMetric(reasons, 'temperature'),
      }),
      createRangeMetric({
        key: 'humidity',
        value: latestTelemetry?.humidityPct ?? null,
        config: phase.humidity,
        reason: getReasonForMetric(reasons, 'humidity'),
      }),
      createRangeMetric({
        key: 'illuminance',
        value: latestTelemetry?.lightLux ?? null,
        config: phase.illuminance,
        reason: getReasonForMetric(reasons, 'illuminance'),
      }),
      createRangeMetric({
        key: 'estimatedPpfd',
        value: latestTelemetry?.estimatedPpfd ?? null,
        config: phase.estimatedPpfd,
        reason: getReasonForMetric(reasons, 'estimatedPpfd'),
      }),
      createRangeMetric({
        key: 'vpd',
        value: latestTelemetry?.vpdKpa ?? null,
        config: phase.vpd,
        reason: getReasonForMetric(reasons, 'vpd'),
      }),
      createCondensationMetric({
        value: latestTelemetry?.condensationMarginC ?? null,
        config: phase.condensationMargin,
        reason: getReasonForMetric(reasons, 'condensationMargin'),
      }),
    ],
  }
}
