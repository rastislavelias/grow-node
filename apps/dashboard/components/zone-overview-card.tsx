import type { ReactNode } from 'react'
import {
  ActivityIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleXIcon,
  ClockIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react'

import type { ZoneOverview } from '@grow-node/contracts'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

type ZoneOverviewCardProps = {
  zone: ZoneOverview
  staleAfterMs: number
}

type ZoneStatus = 'normal' | 'warning' | 'danger' | 'unknown'
type Tone = 'ok' | 'warning' | 'danger' | 'unknown'

export function ZoneOverviewCard({
  zone,
  staleAfterMs,
}: ZoneOverviewCardProps) {
  const zoneStatus = getZoneStatus(zone)

  const controllerOnline = isRecentlySeen(
    zone.controller.lastSeenAt,
    staleAfterMs,
  )

  const lastReadingAt = zone.latestTelemetry?.recordedAt ?? null
  const readingTone = getFreshnessTone(lastReadingAt, staleAfterMs)

  const overviewHealth = getOverviewHealth({
    zoneStatus,
    controllerOnline,
    readingTone,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{zone.name}</CardTitle>
        <CardDescription>{zone.id}</CardDescription>
      </CardHeader>

      <CardContent>
        <ItemGroup className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-4">
          <StatusItem
            icon={<ActivityIcon className="text-muted-foreground size-4" />}
            label="Overall health"
            value={overviewHealth.label}
            tone={overviewHealth.tone}
          />

          <StatusItem
            icon={
              controllerOnline ? (
                <WifiIcon className="text-muted-foreground size-4" />
              ) : (
                <WifiOffIcon className="text-muted-foreground size-4" />
              )
            }
            label="Controller"
            value={`${getControllerLabel(zone.controller.type)} · ${
              controllerOnline ? 'Online' : 'Offline'
            }`}
            tone={controllerOnline ? 'ok' : 'warning'}
          />

          <StatusItem
            icon={<ClockIcon className="text-muted-foreground size-4" />}
            label="Last reading"
            value={formatDate(lastReadingAt)}
            tone={readingTone}
          />
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function StatusItem({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  tone: Tone
}) {
  return (
    <Item size="xs" variant="muted">
      <ItemMedia>{icon}</ItemMedia>

      <ItemContent>
        <ItemDescription>{label}</ItemDescription>
        <ItemTitle>{value}</ItemTitle>
      </ItemContent>

      {tone !== 'ok' ? (
        <ItemActions>
          <ToneBadge tone={tone} label={label} />
        </ItemActions>
      ) : null}
    </Item>
  )
}

function ToneBadge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <Badge
      aria-label={`${label}: ${tone}`}
      title={`${label}: ${tone}`}
      variant={getToneVariant(tone)}
      className={`size-7 justify-center rounded-full px-0 ${getToneClassName(
        tone,
      )}`}
    >
      {getToneIcon(tone)}
    </Badge>
  )
}

// Helpers

function getOverviewHealth({
  zoneStatus,
  controllerOnline,
  readingTone,
}: {
  zoneStatus: ZoneStatus
  controllerOnline: boolean
  readingTone: Tone
}): {
  label: string
  tone: Tone
} {
  if (zoneStatus === 'danger') {
    return {
      label: 'Danger',
      tone: 'danger',
    }
  }

  if (zoneStatus === 'warning') {
    return {
      label: 'Warning',
      tone: 'warning',
    }
  }

  if (!controllerOnline) {
    return {
      label: 'Attention',
      tone: 'warning',
    }
  }

  if (readingTone === 'warning') {
    return {
      label: 'Stale reading',
      tone: 'warning',
    }
  }

  if (readingTone === 'unknown') {
    return {
      label: 'No data',
      tone: 'unknown',
    }
  }

  if (zoneStatus === 'unknown') {
    return {
      label: 'Unknown',
      tone: 'unknown',
    }
  }

  return {
    label: 'Normal',
    tone: 'ok',
  }
}

function getZoneStatus(zone: ZoneOverview): ZoneStatus {
  return zone.state?.status ?? 'unknown'
}

function getFreshnessTone(value: string | null, staleAfterMs: number): Tone {
  if (!value) {
    return 'unknown'
  }

  return isRecentlySeen(value, staleAfterMs) ? 'ok' : 'warning'
}

function getToneIcon(tone: Tone) {
  if (tone === 'danger') {
    return <CircleXIcon className="size-3.5" />
  }

  if (tone === 'warning') {
    return <CircleAlertIcon className="size-3.5" />
  }

  if (tone === 'unknown') {
    return <CircleHelpIcon className="size-3.5" />
  }

  return <CircleCheckIcon className="size-3.5" />
}

function getToneVariant(tone: Tone) {
  if (tone === 'danger') {
    return 'destructive'
  }

  return 'outline'
}

function getToneClassName(tone: Tone): string {
  if (tone === 'danger') {
    return ''
  }

  if (tone === 'warning') {
    return [
      'border-amber-500/60 bg-amber-50 text-amber-700',
      'dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
    ].join(' ')
  }

  return 'border-border bg-background text-muted-foreground dark:bg-transparent'
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'No reading yet'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function isRecentlySeen(value: string | null, staleAfterMs: number): boolean {
  if (!value) {
    return false
  }

  return Date.now() - new Date(value).getTime() <= staleAfterMs
}

function getControllerLabel(type: ZoneOverview['controller']['type']): string {
  if (type === 'esp32') {
    return 'ESP32'
  }

  return 'Simulator'
}
