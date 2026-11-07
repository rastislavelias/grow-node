'use client'
import { CircleGaugeIcon, LeafIcon, SproutIcon } from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SidebarLink } from '@/components/sidebar-link'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const data = {
    navMain: [
      {
        title: 'Dashboard',
        url: '/',
        icon: CircleGaugeIcon,
      },
      {
        title: 'Plant profiles',
        url: '/plant-profiles',
        icon: LeafIcon,
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="mt-2">
              <SidebarLink href="/">
                <SproutIcon className="size-5!" />
                <span className="text-sm leading-tight font-medium">
                  Grow Node
                </span>
              </SidebarLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  )
}
