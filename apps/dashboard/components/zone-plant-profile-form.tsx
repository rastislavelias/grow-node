'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import {
  assignPlantProfileAction,
  type AssignPlantProfileState,
} from '@/app/zones/actions'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const initialState: AssignPlantProfileState = { error: null }

export function ZonePlantProfileForm({
  currentPlantProfile,
  plantProfiles,
  zoneId,
}: {
  currentPlantProfile: { id: string; name: string }
  plantProfiles: Array<{ id: string; name: string }>
  zoneId: string
}) {
  const action = assignPlantProfileAction.bind(null, zoneId)
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Plant profile</CardTitle>
        <CardDescription>
          Select the schedule and environmental targets used by this zone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <label className="text-sm font-medium" htmlFor="plantProfileId">
              Assigned profile
            </label>
            <Select
              defaultValue={currentPlantProfile.id}
              name="plantProfileId"
              required
            >
              <SelectTrigger className="mt-1.5 w-full" id="plantProfileId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plantProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button disabled={pending} type="submit">
            {pending ? 'Saving…' : 'Save profile'}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-muted-foreground">Currently assigned:</span>
          <Link
            className="text-primary font-medium underline-offset-4 hover:underline"
            href={`/plant-profiles/${currentPlantProfile.id}`}
          >
            {currentPlantProfile.name}
          </Link>
        </div>

        {state.error ? (
          <p
            aria-live="polite"
            className="border-destructive/30 bg-destructive/10 text-destructive mt-3 rounded-lg border p-3 text-sm"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
