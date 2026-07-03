'use client'
import Link, { type LinkProps } from 'next/link'

import { useSidebar } from '@/components/ui/sidebar'

export function SidebarLink({
  children,
  ...props
}: LinkProps & {
  children: React.ReactNode
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  function handleClick() {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Link {...props} onClick={handleClick}>
      {children}
    </Link>
  )
}
