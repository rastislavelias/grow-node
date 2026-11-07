import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock3Icon, MapPinIcon, PencilIcon } from 'lucide-react'

import { getPlantProfile } from '@/lib/api'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContainerMain } from '@/components/container-main'
import { PlantProfilePhaseCard } from '@/components/plant-profile-phase-card'
import { SiteHeader } from '@/components/site-header'

export default async function PlantProfilePage({
  params,
}: {
  params: Promise<{ plantProfileId: string }>
}) {
  const { plantProfileId } = await params
  const result = await getPlantProfile(plantProfileId).catch(() => null)

  if (!result) {
    notFound()
  }

  const { plantProfile } = result

  return (
    <>
      <SiteHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden sm:block">
              <BreadcrumbLink asChild>
                <Link href="/plant-profiles">Plant profiles</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="max-w-48 truncate">
                {plantProfile.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <ContainerMain>
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">
                {plantProfile.name}
              </h1>
              <p className="text-muted-foreground">
                Schedule and environmental thresholds used by assigned zones.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/plant-profiles/${plantProfile.id}/edit`}>
                <PencilIcon />
                Edit profile
              </Link>
            </Button>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Profile overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Clock3Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Light schedule</p>
                  <p className="text-muted-foreground text-sm">
                    Starts at{' '}
                    {formatMinutesAsTime(plantProfile.scheduleStartMinutes)} for{' '}
                    {formatDuration(plantProfile.scheduleDurationMinutes)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPinIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Assigned zones</p>
                    <Badge variant="secondary">
                      {plantProfile.zones.length}
                    </Badge>
                  </div>
                  {plantProfile.zones.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {plantProfile.zones.map((zone) => (
                        <li key={zone.id}>
                          <Link
                            className="text-primary text-sm underline-offset-4 hover:underline"
                            href={`/zones/${zone.id}`}
                          >
                            {zone.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Not assigned to a zone
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid items-start gap-4 xl:grid-cols-2">
            <PlantProfilePhaseCard
              description="Targets applied while the grow light is on."
              phase={plantProfile.phaseConfig.lightOn}
              title="Light on"
            />
            <PlantProfilePhaseCard
              description="Targets applied while the grow light is off."
              phase={plantProfile.phaseConfig.lightOff}
              title="Light off"
            />
          </section>
        </div>
      </ContainerMain>
    </>
  )
}

function formatMinutesAsTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const parts = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }

  return parts.join(' ')
}
