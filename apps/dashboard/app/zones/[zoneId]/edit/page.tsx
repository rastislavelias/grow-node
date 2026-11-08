import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPlantProfiles, getZone } from '@/lib/api'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ContainerMain } from '@/components/container-main'
import { SiteHeader } from '@/components/site-header'
import { ZoneForm } from '@/components/zone-form'

export default async function EditZonePage({
  params,
}: {
  params: Promise<{ zoneId: string }>
}) {
  const { zoneId } = await params
  const [zoneResult, profilesResult] = await Promise.all([
    getZone(zoneId).catch(() => null),
    getPlantProfiles(),
  ])

  if (!zoneResult) {
    notFound()
  }

  const { zone } = zoneResult

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
            <BreadcrumbItem className="hidden sm:block">
              <BreadcrumbLink asChild>
                <Link href={`/zones/${zone.id}`}>{zone.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <ContainerMain>
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Edit zone</h1>
            <p className="text-muted-foreground max-w-2xl">
              Update the controller configuration for {zone.name}.
            </p>
          </header>

          <ZoneForm
            initialValue={{
              id: zone.id,
              name: zone.name,
              controllerType: zone.controller.type,
              controllerFirmwareVersion: zone.controller.firmwareVersion,
              plantProfileId: zone.plantProfile.id,
            }}
            plantProfiles={profilesResult.plantProfiles}
            zoneId={zone.id}
          />
        </div>
      </ContainerMain>
    </>
  )
}
