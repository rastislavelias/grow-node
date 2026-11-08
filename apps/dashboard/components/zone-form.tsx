'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import {
  createZoneAction,
  type ZoneFormState,
  updateZoneAction,
} from '@/app/zones/actions'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const initialState: ZoneFormState = { error: null }

export function ZoneForm({
  initialValue,
  plantProfiles,
  zoneId,
}: {
  initialValue?: {
    id: string
    name: string
    controllerType: 'esp32' | 'simulator'
    controllerFirmwareVersion: string | null
    plantProfileId: string
  }
  plantProfiles: Array<{ id: string; name: string }>
  zoneId?: string
}) {
  const saveAction = zoneId
    ? updateZoneAction.bind(null, zoneId)
    : createZoneAction
  const [state, formAction, pending] = useActionState(saveAction, initialState)
  const canCreate = plantProfiles.length > 0
  const isEditing = Boolean(zoneId)
  const cancelHref = zoneId ? `/zones/${zoneId}` : '/'

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zone configuration</CardTitle>
          <CardDescription>
            Register the controller identity and select the targets used by the
            zone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            hint="Lowercase letters, numbers, and hyphens"
            label="Zone ID"
            name="id"
          >
            <Input
              defaultValue={initialValue?.id}
              disabled={isEditing}
              id="id"
              maxLength={64}
              name="id"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="e.g. propagation-zone-1"
              required
            />
          </FormField>
          <FormField label="Display name" name="name">
            <Input
              defaultValue={initialValue?.name}
              id="name"
              maxLength={120}
              name="name"
              placeholder="e.g. Propagation Zone"
              required
            />
          </FormField>
          <FormField label="Controller type" name="controllerType">
            <Select
              defaultValue={initialValue?.controllerType ?? 'esp32'}
              name="controllerType"
              required
            >
              <SelectTrigger className="w-full" id="controllerType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="esp32">ESP32</SelectItem>
                <SelectItem value="simulator">Simulator</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            hint="Optional"
            label="Firmware version"
            name="controllerFirmwareVersion"
          >
            <Input
              defaultValue={initialValue?.controllerFirmwareVersion ?? ''}
              id="controllerFirmwareVersion"
              maxLength={120}
              name="controllerFirmwareVersion"
              placeholder="e.g. esp32-1.0.0"
            />
          </FormField>
          <FormField
            className="sm:col-span-2"
            label="Plant profile"
            name="plantProfileId"
          >
            <Select
              defaultValue={
                initialValue?.plantProfileId ?? plantProfiles[0]?.id
              }
              disabled={!canCreate}
              name="plantProfileId"
              required
            >
              <SelectTrigger className="w-full" id="plantProfileId">
                <SelectValue placeholder="Select a plant profile" />
              </SelectTrigger>
              <SelectContent>
                {plantProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <div className="bg-muted/40 rounded-lg border p-4 text-sm">
        <p className="font-medium">Controller identity</p>
        <p className="text-muted-foreground mt-1">
          The zone ID becomes the controller&apos;s MQTT identity and cannot be
          changed after registration. The controller must publish messages using
          this exact ID. Registering a zone does not provision hardware or start
          another simulator instance.
        </p>
      </div>

      {!canCreate ? (
        <p
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
          role="alert"
        >
          Create a plant profile before registering a zone.
        </p>
      ) : null}

      {state.error ? (
        <p
          aria-live="polite"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button disabled={pending || !canCreate} type="submit">
          {pending
            ? isEditing
              ? 'Saving…'
              : 'Creating…'
            : isEditing
              ? 'Save changes'
              : 'Create zone'}
        </Button>
      </div>
    </form>
  )
}

function FormField({
  children,
  className,
  hint,
  label,
  name,
}: {
  children: React.ReactNode
  className?: string
  hint?: string
  label: string
  name: string
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      {hint ? (
        <span className="text-muted-foreground ml-1 text-xs">{hint}</span>
      ) : null}
      <div className="mt-1.5">{children}</div>
    </div>
  )
}
