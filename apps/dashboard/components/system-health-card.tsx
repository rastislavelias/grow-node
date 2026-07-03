import type { SystemHealthResponse } from '@grow-node/contracts'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SystemHealthCardProps = {
  health: SystemHealthResponse
}

function getBadgeVariant(status: 'ok' | 'down' | 'degraded') {
  if (status === 'ok') {
    return 'default'
  }

  if (status === 'degraded') {
    return 'secondary'
  }

  return 'destructive'
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'No heartbeat yet'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value))
}

export function SystemHealthCard({ health }: SystemHealthCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>System health</CardTitle>
        <Badge variant={getBadgeVariant(health.status)}>{health.status}</Badge>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Database</p>
          <Badge variant={getBadgeVariant(health.dependencies.database)}>
            {health.dependencies.database}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">MQTT</p>
          <Badge variant={getBadgeVariant(health.dependencies.mqtt)}>
            {health.dependencies.mqtt}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Control service</p>
          <Badge variant={getBadgeVariant(health.dependencies.control)}>
            {health.dependencies.control}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Devices seen</p>
          <p className="font-medium">
            {health.devices.recentlySeen}/{health.devices.total}
          </p>
        </div>

        <div className="space-y-1 md:col-span-4">
          <p className="text-muted-foreground text-sm">Last heartbeat</p>
          <p className="font-medium">
            {formatDate(health.devices.lastHeartbeatAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
