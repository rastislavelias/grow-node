import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleXIcon,
  DatabaseIcon,
  RadioTowerIcon,
  RouterIcon,
  SproutIcon,
} from 'lucide-react'

import type { SystemHealthResponse } from '@grow-node/contracts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SystemHealthCardProps = {
  health: SystemHealthResponse
  attentionCount: number
  totalZones: number
}

type BadgeStatus = 'ok' | 'down' | 'degraded'

export function SystemHealthCard({
  health,
  attentionCount,
  totalZones,
}: SystemHealthCardProps) {
  const deviceStatus = getDeviceStatus(health)
  const attentionStatus = getAttentionStatus({ attentionCount, totalZones })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>System health</CardTitle>

        <Badge
          variant={getBadgeVariant(health.status)}
          className={`gap-2 ${getBadgeClassName(health.status)}`}
        >
          <StatusIcon status={health.status} />
          {getStatusLabel(health.status)}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <HealthBadge status={health.dependencies.database}>
            <DatabaseIcon className="size-3.5" />
            Database
          </HealthBadge>

          <HealthBadge status={health.dependencies.mqtt}>
            <RadioTowerIcon className="size-3.5" />
            MQTT
          </HealthBadge>

          <HealthBadge status={health.dependencies.control}>
            <RouterIcon className="size-3.5" />
            Control
          </HealthBadge>

          <HealthBadge status={deviceStatus}>
            <SproutIcon className="size-3.5" />
            Zones online {health.controllers.recentlySeen}/
            {health.controllers.total}
          </HealthBadge>

          <HealthBadge status={attentionStatus}>
            <CircleAlertIcon className="size-3.5" />
            Attention {attentionCount}/{totalZones}
          </HealthBadge>
        </div>
        <p className="text-muted-foreground text-xs">
          Last heartbeat:{' '}
          <span className="text-foreground">
            {formatDate(health.controllers.lastHeartbeatAt)}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}

function HealthBadge({
  children,
  status,
}: {
  children: React.ReactNode
  status: BadgeStatus
}) {
  return (
    <Badge
      variant={getBadgeVariant(status)}
      className={`gap-2 ${getBadgeClassName(status)}`}
    >
      {children}
      <StatusIcon status={status} />
    </Badge>
  )
}

function StatusIcon({ status }: { status: BadgeStatus }) {
  if (status === 'down') {
    return <CircleXIcon className="size-3.5" />
  }

  if (status === 'degraded') {
    return <CircleAlertIcon className="size-3.5" />
  }

  return <CircleCheckIcon className="size-3.5" />
}

// Utils

function getStatusLabel(status: BadgeStatus): string {
  if (status === 'degraded') {
    return 'Attention'
  }

  if (status === 'down') {
    return 'Down'
  }

  return 'OK'
}

function getBadgeClassName(status: BadgeStatus): string {
  if (status === 'down') {
    return ''
  }

  if (status === 'degraded') {
    return [
      'border-amber-500/60 bg-amber-50 text-amber-700',
      'dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
    ].join(' ')
  }

  return [
    'border-border bg-background text-muted-foreground',
    'dark:bg-transparent',
  ].join(' ')
}

function getBadgeVariant(status: BadgeStatus) {
  if (status === 'down') {
    return 'destructive'
  }

  return 'outline'
}

function getDeviceStatus(health: SystemHealthResponse): BadgeStatus {
  if (health.controllers.total === 0) {
    return 'degraded'
  }

  if (health.controllers.recentlySeen === 0) {
    return 'down'
  }

  if (health.controllers.recentlySeen < health.controllers.total) {
    return 'degraded'
  }

  return 'ok'
}

function getAttentionStatus({
  attentionCount,
  totalZones,
}: {
  attentionCount: number
  totalZones: number
}): BadgeStatus {
  if (attentionCount === 0) {
    return 'ok'
  }

  if (totalZones > 0 && attentionCount === totalZones) {
    return 'down'
  }

  return 'degraded'
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'No heartbeat yet'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
