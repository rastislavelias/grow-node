import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ActivityIcon,
  ClockIcon,
  FanIcon,
  LightbulbIcon,
  PencilIcon,
  WifiIcon,
  WifiOffIcon,
} from 'lucide-react'

import {
  getZone,
  getZoneCommands,
  getZoneTelemetry,
  getSystemHealth,
  getPlantProfiles,
} from '@/lib/api'
import {
  getControllerLabel,
  getFreshnessTone,
  getOverviewHealth,
  getZoneStatus,
  isRecentlySeen,
} from '@/lib/zone-status'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ContainerMain } from '@/components/container-main'
import { DeleteZoneButton } from '@/components/delete-zone-button'
import { ItemGroup } from '@/components/ui/item'
import { MetricGaugeCard } from '@/components/metric-gauge'
import { SiteHeader } from '@/components/site-header'
import { StatusItem } from '@/components/status-item'
import { ZonePlantProfileForm } from '@/components/zone-plant-profile-form'

export default async function Page({
  params,
}: {
  params: Promise<{
    zoneId: string
  }>
}) {
  const { zoneId } = await params

  const [zoneResult, telemetryResult, commandsResult, health, profilesResult] =
    await Promise.all([
      getZone(zoneId).catch(() => null),
      getZoneTelemetry(zoneId),
      getZoneCommands(zoneId),
      getSystemHealth(),
      getPlantProfiles(),
    ])

  if (!zoneResult) {
    notFound()
  }

  const { zone, metricEvaluation } = zoneResult
  const coreMetrics = metricEvaluation.metrics.filter(
    (metric) =>
      metric.key === 'temperature' ||
      metric.key === 'humidity' ||
      metric.key === 'illuminance',
  )
  const advancedMetrics = metricEvaluation.metrics.filter(
    (metric) =>
      metric.key === 'estimatedPpfd' ||
      metric.key === 'vpd' ||
      metric.key === 'condensationMargin',
  )

  const zoneStatus = getZoneStatus(zone)

  const controllerOnline = isRecentlySeen(
    zone.controller.lastSeenAt,
    health.controllers.staleAfterMs,
  )

  const lastReadingAt = zone.latestTelemetry?.recordedAt ?? null
  const readingTone = getFreshnessTone(
    lastReadingAt,
    health.controllers.staleAfterMs,
  )

  const overviewHealth = getOverviewHealth({
    zoneStatus,
    controllerOnline,
    readingTone,
  })

  return (
    <>
      <SiteHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:block">
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="max-w-42 truncate">
                {zone.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <ContainerMain>
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {zone.name}
              </h1>
              <p>
                ID: <span className="text-muted-foreground">{zone.id}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button asChild variant="outline">
                <Link href={`/zones/${zone.id}/edit`}>
                  <PencilIcon />
                  Edit zone
                </Link>
              </Button>
              <DeleteZoneButton zoneId={zone.id} zoneName={zone.name} />
            </div>
          </header>

          <section>
            <ItemGroup className="grid max-w-3xl grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-4">
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
          </section>

          {zone.state?.reasons?.length && zone.state.reasons.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Needs attention</CardTitle>
                <CardDescription>
                  Conditions currently outside their configured target range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {zone.state.reasons.map((reason) => (
                    <li
                      className="bg-muted rounded-md px-3 py-2 text-sm"
                      key={reason.metric}
                    >
                      <span className="font-medium">
                        {formatMetricName(reason.metric)}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        is {reason.direction} ({reason.status})
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Core conditions
              </h2>
              <p className="text-muted-foreground text-sm">
                Current environmental readings compared with the plant profile.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
              {coreMetrics.map((metric) => (
                <MetricGaugeCard key={metric.key} metric={metric} />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Advanced conditions
              </h2>
              <p className="text-muted-foreground text-sm">
                Derived readings used to assess plant health and condensation
                risk.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
              {advancedMetrics.map((metric) => (
                <MetricGaugeCard key={metric.key} metric={metric} />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Automation
              </h2>
              <p className="text-muted-foreground text-sm">
                Current lighting phase and desired controller outputs.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Lighting phase</CardTitle>
                  <CardDescription>Active schedule phase</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">
                    {formatPhase(zone.state?.activePhase)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Outputs</CardTitle>
                  <CardDescription>Desired state</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <FanIcon className="text-muted-foreground size-4" />
                    Fan: {zone.state?.fanDesired ? 'On' : 'Off'}
                  </p>
                  <p className="flex items-center gap-2">
                    <LightbulbIcon className="text-muted-foreground size-4" />
                    Light: {zone.state?.lightDesired ? 'On' : 'Off'}
                  </p>
                  <p>Heater: {zone.state?.heaterDesired ? 'On' : 'Off'}</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Configuration
              </h2>
              <p className="text-muted-foreground text-sm">
                Plant profile currently assigned to this zone.
              </p>
            </div>
            <ZonePlantProfileForm
              currentPlantProfile={zone.plantProfile}
              plantProfiles={profilesResult.plantProfiles}
              zoneId={zone.id}
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Recent telemetry</CardTitle>
              <CardDescription>Latest sensor readings</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-left">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Temp</th>
                    <th className="py-2 pr-4 font-medium">Humidity</th>
                    <th className="py-2 pr-4 font-medium">Light</th>
                    <th className="py-2 pr-4 font-medium">VPD</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetryResult.readings.map((reading) => (
                    <tr key={reading.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {formatDate(reading.recordedAt)}
                      </td>
                      <td className="py-2 pr-4">{reading.temperatureC}°C</td>
                      <td className="py-2 pr-4">{reading.humidityPct}%</td>
                      <td className="py-2 pr-4">{reading.lightLux} lx</td>
                      <td className="py-2 pr-4">
                        {reading.vpdKpa ?? 'No data'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Command history</CardTitle>
              <CardDescription>Recent zone commands</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-left">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Source</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Fan</th>
                    <th className="py-2 pr-4 font-medium">Light</th>
                    <th className="py-2 pr-4 font-medium">Heater</th>
                  </tr>
                </thead>
                <tbody>
                  {commandsResult.commands.map((command) => (
                    <tr key={command.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {formatDate(command.createdAt)}
                      </td>
                      <td className="py-2 pr-4">{command.source}</td>
                      <td className="py-2 pr-4">{command.status}</td>
                      <td className="py-2 pr-4">
                        {command.payload.fan ? 'On' : 'Off'}
                      </td>
                      <td className="py-2 pr-4">
                        {command.payload.light ? 'On' : 'Off'}
                      </td>
                      <td className="py-2 pr-4">
                        {command.payload.heater ? 'On' : 'Off'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </ContainerMain>
    </>
  )
}

// Helpers

function formatDate(value: string | null): string {
  if (!value) {
    return 'No data yet'
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatPhase(value: 'lightOn' | 'lightOff' | undefined): string {
  if (!value) {
    return 'No state'
  }

  return value === 'lightOn' ? 'Light on' : 'Light off'
}

function formatMetricName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase())
}
