import {
  ActivityIcon,
  FanIcon,
  LightbulbIcon,
  ThermometerIcon,
} from 'lucide-react'

import { getSystemHealth, getZones } from '@/lib/api'

import { AutoRefresh } from '@/components/auto-refresh'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContainerMain } from '@/components/container-main'
import { SiteHeader } from '@/components/site-header'
import { SystemHealthCard } from '@/components/system-health-card'

export default async function Home() {
  const [{ zones }, health] = await Promise.all([getZones(), getSystemHealth()])

  const onlineDevices = zones.reduce((total, zone) => {
    return total + zone.devices.filter((device) => device.lastSeenAt).length
  }, 0)

  const zonesNeedingAttention = zones.filter((zone) => {
    return zone.state?.status === 'warning' || zone.state?.status === 'danger'
  }).length

  const latestTelemetryTime =
    zones.find((zone) => zone.latestTelemetry)?.latestTelemetry?.recordedAt ??
    null

  return (
    <>
      <AutoRefresh intervalMs={5000} />
      <SiteHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <ContainerMain>
        <div className="space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Live local overview of simulated grow-zone telemetry and device
              state.
            </p>
          </header>
          <SystemHealthCard health={health} />

          <section className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total zones</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {zones.length}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Online devices</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {onlineDevices}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attention</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {zonesNeedingAttention}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest reading</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {formatDate(latestTelemetryTime)}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {zones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{zone.name}</CardTitle>
                      <p className="text-muted-foreground text-sm">{zone.id}</p>
                    </div>

                    <Badge
                      variant={getStatusVariant(zone.state?.status ?? null)}
                    >
                      {zone.state?.status ?? 'unknown'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-sm">Phase</p>
                    <p className="font-medium">
                      {zone.state?.activePhase === 'lightOn'
                        ? 'Light on'
                        : 'Light off'}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-sm">
                      Heater desired
                    </p>
                    <p className="font-medium">
                      {zone.state?.heaterDesired ? 'On' : 'Off'}
                    </p>
                  </div>

                  {zone.state?.reasons.length ? (
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground text-sm">Reasons</p>
                      <p className="font-medium">
                        {zone.state.reasons
                          .map((reason) => `${reason.metric}: ${reason.status}`)
                          .join(', ')}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <ThermometerIcon className="size-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Temperature
                      </p>
                      <p className="font-medium">
                        {zone.latestTelemetry
                          ? `${zone.latestTelemetry.temperatureC}°C`
                          : 'No data'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ActivityIcon className="size-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">Humidity</p>
                      <p className="font-medium">
                        {zone.latestTelemetry
                          ? `${zone.latestTelemetry.humidityPct}%`
                          : 'No data'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FanIcon className="size-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Fan desired
                      </p>
                      <p className="font-medium">
                        {zone.state?.fanDesired ? 'On' : 'Off'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <LightbulbIcon className="size-5" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Light desired
                      </p>
                      <p className="font-medium">
                        {zone.state?.lightDesired ? 'On' : 'Off'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </ContainerMain>
    </>
  )
}

// Utils
function formatDate(value: string | null): string {
  if (!value) {
    return 'No data yet'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusVariant(
  status: string | null,
): 'default' | 'secondary' | 'destructive' {
  if (status === 'danger') {
    return 'destructive'
  }

  if (status === 'warning') {
    return 'secondary'
  }

  return 'default'
}
