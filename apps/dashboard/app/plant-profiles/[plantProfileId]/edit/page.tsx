import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPlantProfile } from '@/lib/api'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ContainerMain } from '@/components/container-main'
import { PlantProfileForm } from '@/components/plant-profile-form'
import { SiteHeader } from '@/components/site-header'

export default async function EditPlantProfilePage({
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
            <BreadcrumbItem className="hidden sm:block">
              <BreadcrumbLink asChild>
                <Link href={`/plant-profiles/${plantProfile.id}`}>
                  {plantProfile.name}
                </Link>
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
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit plant profile
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Update the schedule and environmental ranges for{' '}
              {plantProfile.name}.
            </p>
          </header>

          <PlantProfileForm
            initialValue={{
              name: plantProfile.name,
              scheduleStartMinutes: plantProfile.scheduleStartMinutes,
              scheduleDurationMinutes: plantProfile.scheduleDurationMinutes,
              phaseConfig: plantProfile.phaseConfig,
            }}
            plantProfileId={plantProfile.id}
          />
        </div>
      </ContainerMain>
    </>
  )
}
