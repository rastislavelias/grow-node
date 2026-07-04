import { getSystemHealth, getZones } from '@/lib/api'

import { AutoRefresh } from '@/components/auto-refresh'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { ContainerMain } from '@/components/container-main'
import { SiteHeader } from '@/components/site-header'
import { SystemHealthCard } from '@/components/system-health-card'
import { ZoneOverviewCard } from '@/components/zone-overview-card'

export default async function Home() {
  const [{ zones }, health] = await Promise.all([getZones(), getSystemHealth()])

  const zonesNeedingAttention = zones.filter((zone) => {
    return zone.state?.status === 'warning' || zone.state?.status === 'danger'
  }).length

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
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          </header>
          <SystemHealthCard
            health={health}
            attentionCount={zonesNeedingAttention}
            totalZones={zones.length}
          />

          <section className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,30rem),30rem))] gap-4">
            {zones.map((zone) => (
              <ZoneOverviewCard
                key={zone.id}
                zone={zone}
                staleAfterMs={health.controllers.staleAfterMs}
              />
            ))}
          </section>
        </div>
      </ContainerMain>
    </>
  )
}
