import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ActivityIcon,
  ClockIcon,
  FanIcon,
  LightbulbIcon,
  PencilIcon,
  ThermometerIcon,
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
  const latest = zone.latestTelemetry

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

          <ZonePlantProfileForm
            currentPlantProfile={zone.plantProfile}
            plantProfiles={profilesResult.plantProfiles}
            zoneId={zone.id}
          />

          <section>
            {zone.state?.reasons?.length && zone.state.reasons.length > 0 ? (
              <ul className="space-y-2">
                {zone.state?.reasons.map((reason) => (
                  <li key={reason.metric}>{reason.metric}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
            {/* Temporary debug card */}
            <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
              {metricEvaluation.metrics.map((metric) => (
                <MetricGaugeCard key={metric.key} metric={metric} />
              ))}
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {latest ? `${zone.state?.activePhase}` : 'No data'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Temperature</CardTitle>
                <CardDescription>Latest reading</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <ThermometerIcon className="text-muted-foreground size-5" />
                <p className="text-2xl font-semibold">
                  {latest ? `${latest.temperatureC}°C` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Humidity</CardTitle>
                <CardDescription>Latest reading</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {latest ? `${latest.humidityPct}%` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Light</CardTitle>
                <CardDescription>Lux / PPFD</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {latest ? `${latest.lightLux} lx` : 'No data'}
                </p>
                <p className="text-muted-foreground text-sm">
                  PPFD: {latest?.estimatedPpfd ?? 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>VPD</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {latest ? `${latest.vpdKpa} kPa` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>Condensation margin</CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {latest ? `${latest.condensationMarginC}°C` : 'No data'}
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
