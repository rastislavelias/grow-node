import Link from 'next/link'

import { newPlantProfileDefaults } from '@/lib/plant-profile-defaults'

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

export default function NewPlantProfilePage() {
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
            <BreadcrumbItem>
              <BreadcrumbPage>New profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <ContainerMain>
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Create plant profile
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Define the light schedule and acceptable environmental ranges for
              both phases. The starting values are a practical template and can
              all be changed.
            </p>
          </header>

          <PlantProfileForm initialValue={newPlantProfileDefaults} />
        </div>
      </ContainerMain>
    </>
  )
}
