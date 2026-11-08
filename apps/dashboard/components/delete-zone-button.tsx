'use client'

import { useActionState } from 'react'
import { Trash2Icon } from 'lucide-react'

import { deleteZoneAction, type DeleteZoneState } from '@/app/zones/actions'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

const initialState: DeleteZoneState = { error: null }

export function DeleteZoneButton({
  zoneId,
  zoneName,
}: {
  zoneId: string
  zoneName: string
}) {
  const action = deleteZoneAction.bind(null, zoneId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          <Trash2Icon />
          Delete zone
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {zoneName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the zone and all of its telemetry,
            heartbeat records, command history, and current state. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {state.error ? (
          <p
            aria-live="polite"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <Button disabled={pending} type="submit" variant="destructive">
              {pending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
