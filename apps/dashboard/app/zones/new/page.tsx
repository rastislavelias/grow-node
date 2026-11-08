import Link from 'next/link'

import { getPlantProfiles } from '@/lib/api'

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

export default async function NewZonePage() {
  const { plantProfiles } = await getPlantProfiles()

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
            <BreadcrumbItem>
              <BreadcrumbPage>New zone</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </SiteHeader>
      <ContainerMain>
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Create zone
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Register a controller and connect it to an environmental profile.
            </p>
          </header>

          <ZoneForm plantProfiles={plantProfiles} />
        </div>
      </ContainerMain>
    </>
  )
}
