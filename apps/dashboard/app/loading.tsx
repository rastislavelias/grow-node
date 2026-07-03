import { Loader2Icon } from 'lucide-react'

import { ContainerMain } from '@/components/container-main'

export default function Loading() {
  return (
    <ContainerMain>
      <div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
        <Loader2Icon className="size-4 animate-spin" /> Loading...
      </div>
    </ContainerMain>
  )
}
