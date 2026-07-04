import Link from 'next/link'
import { ActivityIcon, ClockIcon, WifiIcon, WifiOffIcon } from 'lucide-react'

import type { ZoneOverview } from '@grow-node/contracts'
import {
  getControllerLabel,
  getFreshnessTone,
  getOverviewHealth,
  getZoneStatus,
  isRecentlySeen,
} from '@/lib/zone-status'

import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ItemGroup } from '@/components/ui/item'
import { StatusItem } from './status-item'

type ZoneOverviewCardProps = {
  zone: ZoneOverview
  staleAfterMs: number
}

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

      <CardFooter>
        <Link
          href={`/zones/${zone.id}`}
          className={buttonVariants({ variant: 'outline' })}
        >
          View zone
        </Link>
      </CardFooter>
    </Card>
  )
}

// Helpers

function formatDate(value: string | null): string {
  if (!value) {
    return 'No reading yet'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
