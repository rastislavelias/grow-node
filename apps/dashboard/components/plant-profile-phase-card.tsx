import type {
  CondensationMarginConfig,
  MetricRangeConfig,
  PhaseMetricsConfig,
} from '@grow-node/contracts'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const rangeMetrics: {
  key: Exclude<keyof PhaseMetricsConfig, 'condensationMargin'>
  label: string
  unit: string
}[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'illuminance', label: 'Illuminance', unit: 'lx' },
  { key: 'estimatedPpfd', label: 'Estimated PPFD', unit: 'µmol/m²/s' },
  { key: 'vpd', label: 'VPD', unit: 'kPa' },
]

export function PlantProfilePhaseCard({
  description,
  phase,
  title,
}: {
  description: string
  phase: PhaseMetricsConfig
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline">6 metrics</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rangeMetrics.map((metric) => (
          <RangeMetric
            key={metric.key}
            config={phase[metric.key]}
            label={metric.label}
            unit={metric.unit}
          />
        ))}
        <CondensationMetric config={phase.condensationMargin} />
      </CardContent>
    </Card>
  )
}

function RangeMetric({
  config,
  label,
  unit,
}: {
  config: MetricRangeConfig
  label: string
  unit: string
}) {
  return (
    <section className="rounded-lg border p-3">
      <h3 className="font-medium">{label}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <MetricValue
          label="Optimal"
          value={formatRange(config.optimal, unit)}
        />
        <MetricValue
          label="Warning"
          value={formatRange(config.warning, unit)}
        />
        {config.scale ? (
          <MetricValue label="Scale" value={formatRange(config.scale, unit)} />
        ) : null}
        <MetricValue
          label="Settling time"
          value={formatSettlingTime(config.settleMinutes)}
        />
      </dl>
    </section>
  )
}

function CondensationMetric({ config }: { config: CondensationMarginConfig }) {
  return (
    <section className="rounded-lg border p-3">
      <h3 className="font-medium">Condensation margin</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <MetricValue label="Low risk" value={`≥ ${config.lowRiskMin} °C`} />
        <MetricValue
          label="Medium risk"
          value={`≥ ${config.mediumRiskMin} °C`}
        />
        <MetricValue label="Scale" value={formatRange(config.scale, '°C')} />
        <MetricValue
          label="Settling time"
          value={formatSettlingTime(config.settleMinutes)}
        />
      </dl>
    </section>
  )
}

function MetricValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function formatRange(range: [number, number], unit: string) {
  return `${range[0]}–${range[1]} ${unit}`
}

function formatSettlingTime(minutes: number) {
  return minutes === 0 ? 'Immediate' : `${minutes} min`
}
