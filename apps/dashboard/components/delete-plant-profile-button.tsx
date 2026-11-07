'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Trash2Icon } from 'lucide-react'

import {
  deletePlantProfileAction,
  type DeletePlantProfileState,
} from '@/app/plant-profiles/actions'

import { Button } from '@/components/ui/button'

const initialState: DeletePlantProfileState = {
  error: null,
  zones: [],
}

export function DeletePlantProfileButton({
  plantProfileId,
  plantProfileName,
}: {
  plantProfileId: string
  plantProfileName: string
}) {
  const [confirming, setConfirming] = useState(false)
  const deleteAction = deletePlantProfileAction.bind(null, plantProfileId)
  const [state, formAction, pending] = useActionState(
    deleteAction,
    initialState,
  )

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        hidden={confirming}
        onClick={() => setConfirming(true)}
        type="button"
        variant="destructive"
      >
        <Trash2Icon />
        Delete profile
      </Button>

      <div
        aria-labelledby="delete-profile-title"
        className="bg-background w-[min(28rem,calc(100vw-2rem))] rounded-lg border p-4 text-left shadow-lg"
        hidden={!confirming}
        role="alertdialog"
      >
        <h2 className="font-semibold" id="delete-profile-title">
          Delete {plantProfileName}?
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          This permanently removes the profile. This action cannot be undone.
        </p>

        {state.error ? (
          <div
            aria-live="polite"
            className="border-destructive/30 bg-destructive/10 text-destructive mt-3 rounded-lg border p-3 text-sm"
            role="alert"
          >
            <p>{state.error}</p>
            {state.zones.length > 0 ? (
              <div className="mt-2">
                <p className="font-medium">Assigned zones:</p>
                <ul className="mt-1 list-inside list-disc">
                  {state.zones.map((zone) => (
                    <li key={zone.id}>
                      <Link
                        className="underline underline-offset-4"
                        href={`/zones/${zone.id}`}
                      >
                        {zone.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <form action={formAction} className="mt-4 flex justify-end gap-2">
          <Button
            onClick={() => setConfirming(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={pending} type="submit" variant="destructive">
            {pending ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </form>
      </div>
    </div>
  )
}
