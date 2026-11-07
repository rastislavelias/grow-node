import Link from 'next/link'
import {
  ArrowRightIcon,
  Clock3Icon,
  LeafIcon,
  MapPinIcon,
  PlusIcon,
} from 'lucide-react'

import { getPlantProfiles } from '@/lib/api'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ContainerMain } from '@/components/container-main'
import { SiteHeader } from '@/components/site-header'

export default async function PlantProfilesPage() {
  const { plantProfiles } = await getPlantProfiles()

  return (
    <>
      <SiteHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Plant profiles</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <ContainerMain>
        <div className="space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">
                Plant profiles
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Reusable light schedules and environmental thresholds for your
                growing zones.
              </p>
            </div>
            <Button asChild>
              <Link href="/plant-profiles/new">
                <PlusIcon />
                New profile
              </Link>
            </Button>
          </header>

          {plantProfiles.length === 0 ? (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>No plant profiles yet</CardTitle>
                <CardDescription>
                  Create a profile to define a schedule and target conditions
                  for your zones.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <section className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,22rem),1fr))] gap-4">
              {plantProfiles.map((profile) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <LeafIcon className="text-muted-foreground size-4" />
                          {profile.name}
                        </CardTitle>
                        <CardDescription>
                          Light-on and light-off thresholds for 6 environmental
                          metrics
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {formatZoneCount(profile.zones.length)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Clock3Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div>
                        <p className="font-medium">Light schedule</p>
                        <p className="text-muted-foreground text-sm">
                          {formatMinutesAsTime(profile.scheduleStartMinutes)} ·{' '}
                          {formatDuration(profile.scheduleDurationMinutes)} on
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPinIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">Assigned zones</p>
                        {profile.zones.length > 0 ? (
                          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {profile.zones.map((zone) => (
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

                    <Link
                      className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                      href={`/plant-profiles/${profile.id}`}
                    >
                      View profile
                      <ArrowRightIcon className="size-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}
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

function formatZoneCount(count: number) {
  return `${count} ${count === 1 ? 'zone' : 'zones'}`
}
