import type { ReactNode } from 'react'
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  CircleXIcon,
} from 'lucide-react'

import type { Tone } from '@/lib/zone-status'

import { Badge } from '@/components/ui/badge'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

export function StatusItem({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  tone: Tone
}) {
  return (
    <Item size="xs" variant="muted">
      <ItemMedia>{icon}</ItemMedia>

      <ItemContent>
        <ItemDescription>{label}</ItemDescription>
        <ItemTitle>{value}</ItemTitle>
      </ItemContent>

      {tone !== 'ok' ? (
        <ItemActions>
          <ToneBadge tone={tone} label={label} />
        </ItemActions>
      ) : null}
    </Item>
  )
}

function ToneBadge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <Badge
      aria-label={`${label}: ${tone}`}
      title={`${label}: ${tone}`}
      variant={getToneVariant(tone)}
      className={`size-7 justify-center rounded-full px-0 ${getToneClassName(
        tone,
      )}`}
    >
      {getToneIcon(tone)}
    </Badge>
  )
}

// Helpers

function getToneVariant(tone: Tone) {
  if (tone === 'danger') {
    return 'destructive'
  }

  return 'outline'
}

function getToneClassName(tone: Tone): string {
  if (tone === 'danger') {
    return ''
  }

  if (tone === 'warning') {
    return [
      'border-amber-500/60 bg-amber-50 text-amber-700',
      'dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300',
    ].join(' ')
  }

  return 'border-border bg-background text-muted-foreground dark:bg-transparent'
}

function getToneIcon(tone: Tone) {
  if (tone === 'danger') {
    return <CircleXIcon className="size-3.5" />
  }

  if (tone === 'warning') {
    return <CircleAlertIcon className="size-3.5" />
  }

  if (tone === 'unknown') {
    return <CircleHelpIcon className="size-3.5" />
  }

  return <CircleCheckIcon className="size-3.5" />
}
