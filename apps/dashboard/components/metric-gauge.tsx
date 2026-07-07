import type { ZoneMetricView } from '@grow-node/contracts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type GaugeTone = 'optimal' | 'settling' | 'warning' | 'danger'
type SegmentTone = 'optimal' | 'warning' | 'danger'

type GaugeSegment = {
  from: number
  to: number
  tone: SegmentTone
}

type DisplaySegment = GaugeSegment & {
  index: number
  startAngle: number
  endAngle: number
}

type Scale = {
  min: number
  max: number
}

const gaugeWidth = 180
const strokeWidth = 10
const padding = 4
const segmentGapPx = 3
const indicatorGap = 3
const autoScaleMarginRatio = 0.1

export function MetricGaugeCard({ metric }: { metric: ZoneMetricView }) {
  return (
    <Card>
      <CardHeader className="items-center pb-0 text-center">
        <CardTitle className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {metric.label}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <MetricGauge metric={metric} />
      </CardContent>
    </Card>
  )
}

function MetricGauge({ metric }: { metric: ZoneMetricView }) {
  const scale = resolveScale(metric)
  const geometry = getGeometry()
  const currentTone = getGaugeTone(metric)
  const clampedValue =
    metric.value === null ? null : clamp(metric.value, scale.min, scale.max)

  const segments = createSegments(metric, scale)
  const activeSegmentIndex =
    clampedValue === null || currentTone === null
      ? null
      : getActiveSegmentIndex({
          segments,
          value: clampedValue,
          currentTone,
          scale,
        })

  const displaySegments = createDisplaySegments({
    segments,
    activeSegmentIndex,
    currentTone,
    scale,
    radius: geometry.radius,
  })

  const activeDisplaySegment =
    activeSegmentIndex === null
      ? null
      : (displaySegments.find((segment) => {
          return segment.index === activeSegmentIndex
        }) ?? null)

  const indicatorAngle =
    clampedValue === null || activeDisplaySegment === null
      ? null
      : valueToDisplayAngle({
          value: clampedValue,
          segment: activeDisplaySegment,
        })

  const activeStrokeWidth =
    activeDisplaySegment === null ? strokeWidth : strokeWidth

  const indicatorTip =
    indicatorAngle === null
      ? null
      : polarToCartesian({
          centerX: geometry.centerX,
          centerY: geometry.centerY,
          radius: geometry.radius - activeStrokeWidth / 2 - indicatorGap,
          angle: indicatorAngle,
        })

  return (
    <div
      className="relative mx-auto w-full overflow-visible"
      style={{
        maxWidth: gaugeWidth,
        aspectRatio: `${gaugeWidth} / ${geometry.height}`,
      }}
    >
      <svg
        viewBox={`0 0 ${gaugeWidth} ${geometry.height}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {displaySegments.map((segment) => {
          const isActive = segment.index === activeSegmentIndex

          if (segment.endAngle <= segment.startAngle) {
            return null
          }

          return (
            <path
              key={`${segment.index}-${segment.from}-${segment.to}`}
              d={describeArc({
                centerX: geometry.centerX,
                centerY: geometry.centerY,
                radius: geometry.radius,
                startAngle: segment.startAngle,
                endAngle: segment.endAngle,
              })}
              className={cn(
                getSegmentStrokeClassName(segment.tone, currentTone),
                isActive ? 'opacity-100' : 'opacity-20',
                'transition-opacity',
              )}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          )
        })}

        {indicatorAngle !== null && indicatorTip !== null ? (
          <polygon
            points="0 0 -5 9 5 9"
            transform={`translate(${indicatorTip.x} ${indicatorTip.y}) rotate(${
              indicatorAngle + 90
            })`}
            className={getIndicatorClassName(currentTone)}
          />
        ) : null}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span
          className={cn(
            'text-4xl leading-none font-semibold tracking-tight',
            getValueClassName(currentTone),
          )}
        >
          {formatMetricValue(metric)}
        </span>

        <span className="text-muted-foreground mt-1 text-sm">
          {metric.value === null ? metric.unit : metric.unit}
        </span>
      </div>
    </div>
  )
}

function getGaugeTone(metric: ZoneMetricView): GaugeTone | null {
  if (metric.value === null || metric.state === 'unknown') {
    return null
  }

  return metric.state
}

function formatMetricValue(metric: ZoneMetricView): string {
  if (metric.value === null) {
    return '—'
  }

  return metric.value.toFixed(metric.precision)
}

function resolveScale(metric: ZoneMetricView): Scale {
  if (metric.range.kind === 'risk') {
    return {
      min: metric.range.scale[0],
      max: metric.range.scale[1],
    }
  }

  if (metric.range.scale) {
    return {
      min: metric.range.scale[0],
      max: metric.range.scale[1],
    }
  }

  const [warningMin, warningMax] = metric.range.warning

  const min = warningMin - Math.abs(warningMin) * autoScaleMarginRatio
  const max = warningMax + Math.abs(warningMax) * autoScaleMarginRatio

  if (min < max) {
    return {
      min,
      max,
    }
  }

  const fallbackPadding =
    Math.max(Math.abs(warningMin), Math.abs(warningMax), 1) *
    autoScaleMarginRatio

  return {
    min: warningMin - fallbackPadding,
    max: warningMax + fallbackPadding,
  }
}

function createSegments(metric: ZoneMetricView, scale: Scale): GaugeSegment[] {
  if (metric.range.kind === 'risk') {
    return [
      {
        from: scale.min,
        to: metric.range.mediumRiskMin,
        tone: 'danger',
      },
      {
        from: metric.range.mediumRiskMin,
        to: metric.range.lowRiskMin,
        tone: 'warning',
      },
      {
        from: metric.range.lowRiskMin,
        to: scale.max,
        tone: 'optimal',
      },
    ]
  }

  const [optimalMin, optimalMax] = metric.range.optimal
  const [warningMin, warningMax] = metric.range.warning

  return [
    {
      from: scale.min,
      to: warningMin,
      tone: 'danger',
    },
    {
      from: warningMin,
      to: optimalMin,
      tone: 'warning',
    },
    {
      from: optimalMin,
      to: optimalMax,
      tone: 'optimal',
    },
    {
      from: optimalMax,
      to: warningMax,
      tone: 'warning',
    },
    {
      from: warningMax,
      to: scale.max,
      tone: 'danger',
    },
  ]
}

function getGeometry() {
  const centerX = gaugeWidth / 2
  const radius = gaugeWidth / 2 - strokeWidth / 2 - padding
  const centerY = radius + strokeWidth / 2 + padding
  const height = centerY + strokeWidth / 2 + padding

  return {
    centerX,
    centerY,
    radius,
    height,
  }
}

function getActiveSegmentIndex({
  segments,
  value,
  currentTone,
  scale,
}: {
  segments: GaugeSegment[]
  value: number
  currentTone: GaugeTone
  scale: Scale
}): number | null {
  const targetTone: SegmentTone =
    currentTone === 'settling' ? 'warning' : currentTone

  const statusMatchIndex = segments.findIndex((segment) => {
    const from = clamp(segment.from, scale.min, scale.max)
    const to = clamp(segment.to, scale.min, scale.max)

    return segment.tone === targetTone && value >= from && value <= to
  })

  if (statusMatchIndex !== -1) {
    return statusMatchIndex
  }

  const valueMatchIndex = segments.findIndex((segment) => {
    const from = clamp(segment.from, scale.min, scale.max)
    const to = clamp(segment.to, scale.min, scale.max)

    return value >= from && value <= to
  })

  return valueMatchIndex === -1 ? null : valueMatchIndex
}

function createDisplaySegments({
  segments,
  activeSegmentIndex,
  currentTone,
  scale,
  radius,
}: {
  segments: GaugeSegment[]
  activeSegmentIndex: number | null
  currentTone: GaugeTone | null
  scale: Scale
  radius: number
}): DisplaySegment[] {
  const visibleSegments = segments
    .map((segment, index) => {
      return {
        ...segment,
        index,
        from: clamp(segment.from, scale.min, scale.max),
        to: clamp(segment.to, scale.min, scale.max),
      }
    })
    .filter((segment) => {
      return segment.to > segment.from
    })
    .filter((segment) => {
      return shouldShowSegment({
        segment,
        currentTone,
      })
    })

  const segmentGapAngle =
    visibleSegments.length > 1 ? pxToAngle(segmentGapPx, radius) : 0

  const totalGapAngle =
    segmentGapAngle * Math.max(visibleSegments.length - 1, 0)

  const drawableAngle = Math.max(180 - totalGapAngle, 0)

  const lengths = visibleSegments.map((segment) => {
    return segment.to - segment.from
  })

  const totalLength = lengths.reduce((total, length) => {
    return total + length
  }, 0)

  let currentAngle = 180

  return visibleSegments.map((segment, index) => {
    const angleSize =
      totalLength > 0 ? (lengths[index] / totalLength) * drawableAngle : 0

    const displaySegment = {
      ...segment,
      startAngle: currentAngle,
      endAngle: currentAngle + angleSize,
    }

    currentAngle += angleSize + segmentGapAngle

    return displaySegment
  })
}

function shouldShowSegment({
  segment,
  currentTone,
}: {
  segment: GaugeSegment
  currentTone: GaugeTone | null
}): boolean {
  if (currentTone === 'optimal' && segment.tone === 'danger') {
    return false
  }

  return true
}

function valueToDisplayAngle({
  value,
  segment,
}: {
  value: number
  segment: DisplaySegment
}): number {
  const progress = (value - segment.from) / (segment.to - segment.from)

  return (
    segment.startAngle +
    clamp(progress, 0, 1) * (segment.endAngle - segment.startAngle)
  )
}

function describeArc({
  centerX,
  centerY,
  radius,
  startAngle,
  endAngle,
}: {
  centerX: number
  centerY: number
  radius: number
  startAngle: number
  endAngle: number
}): string {
  const start = polarToCartesian({
    centerX,
    centerY,
    radius,
    angle: startAngle,
  })

  const end = polarToCartesian({
    centerX,
    centerY,
    radius,
    angle: endAngle,
  })

  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
  ].join(' ')
}

function polarToCartesian({
  centerX,
  centerY,
  radius,
  angle,
}: {
  centerX: number
  centerY: number
  radius: number
  angle: number
}) {
  const angleInRadians = (angle * Math.PI) / 180

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function getSegmentStrokeClassName(
  tone: SegmentTone,
  currentTone: GaugeTone | null,
): string {
  if (tone === 'optimal') {
    return 'stroke-emerald-500'
  }

  if (tone === 'warning') {
    return currentTone === 'settling' ? 'stroke-sky-500' : 'stroke-amber-500'
  }

  return 'stroke-red-500'
}

function getIndicatorClassName(currentTone: GaugeTone | null): string {
  if (currentTone === 'danger') {
    return 'fill-red-500'
  }

  if (currentTone === 'warning') {
    return 'fill-amber-500'
  }

  if (currentTone === 'settling') {
    return 'fill-sky-500'
  }

  return 'fill-emerald-500'
}

function getValueClassName(currentTone: GaugeTone | null): string {
  if (currentTone === 'danger') {
    return 'text-red-400'
  }

  if (currentTone === 'warning') {
    return 'text-amber-400'
  }

  if (currentTone === 'settling') {
    return 'text-sky-400'
  }

  return 'text-foreground'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function pxToAngle(px: number, radius: number): number {
  return (px / radius) * (180 / Math.PI)
}
