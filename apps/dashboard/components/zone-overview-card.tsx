import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  MoonIcon,
  SunIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react'

import type { ZoneOverview } from '@grow-node/contracts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ZoneOverviewCardProps = {
  zone: ZoneOverview
  staleAfterMs: number
}

type BadgeStatus = 'normal' | 'warning' | 'danger' | 'unknown'

function getZoneStatus(zone: ZoneOverview): BadgeStatus {
  return zone.state?.status ?? 'unknown'
}

function getStatusLabel(status: BadgeStatus): string {
  if (status === 'danger') {
    return 'Danger'
  }

  if (status === 'warning') {
    return 'Warning'
  }

  if (status === 'unknown') {
    return 'Unknown'
  }

  return 'Normal'
}

function getStatusIcon(status: BadgeStatus) {
  if (status === 'danger') {
    return <CircleXIcon className="size-3.5" />
  }

  if (status === 'warning') {
    return <CircleAlertIcon className="size-3.5" />
  }

  return <CircleCheckIcon className="size-3.5" />
}

function getStatusClassName(status: BadgeStatus): string {
  if (status === 'danger') {
    return ''
  }

  if (status === 'warning') {
    return [
      'border-amber-500/60 bg-amber-50 text-amber-700',
      'dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
    ].join(' ')
  }

  if (status === 'unknown') {
    return 'border-border bg-muted/30 text-muted-foreground'
  }

  return 'border-border bg-muted/30 text-muted-foreground'
}

function getStatusVariant(status: BadgeStatus) {
  if (status === 'danger') {
    return 'destructive'
  }

  return 'outline'
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

export function ZoneOverviewCard({
  zone,
  staleAfterMs,
}: ZoneOverviewCardProps) {
  const status = getZoneStatus(zone)
  const controllerOnline = isRecentlySeen(
    zone.controller.lastSeenAt,
    staleAfterMs,
  )
  const isLightOn = zone.state?.activePhase === 'lightOn'

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{zone.name}</CardTitle>
          <p className="text-muted-foreground text-sm">{zone.id}</p>
        </div>

        <Badge
          variant={getStatusVariant(status)}
          className={`gap-2 ${getStatusClassName(status)}`}
        >
          {getStatusIcon(status)}
          {getStatusLabel(status)}
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          {isLightOn ? (
            <SunIcon className="text-muted-foreground size-4" />
          ) : (
            <MoonIcon className="text-muted-foreground size-4" />
          )}

          <div>
            <p className="text-muted-foreground text-sm">Phase</p>
            <p className="font-medium">
              {isLightOn ? 'Light on' : 'Light off'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {controllerOnline ? (
            <WifiIcon className="text-muted-foreground size-4" />
          ) : (
            <WifiOffIcon className="text-muted-foreground size-4" />
          )}

          <div>
            <p className="text-muted-foreground text-sm">Controller</p>
            <p className="font-medium">
              {getControllerLabel(zone.controller.type)} ·{' '}
              {controllerOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ClockIcon className="text-muted-foreground size-4" />

          <div>
            <p className="text-muted-foreground text-sm">Last reading</p>
            <p className="font-medium">
              {formatDate(zone.latestTelemetry?.recordedAt ?? null)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
