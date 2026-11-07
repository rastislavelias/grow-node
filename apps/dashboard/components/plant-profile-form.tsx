'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type {
  MetricRangeConfig,
  PhaseMetricsConfig,
  PlantProfileInput,
} from '@grow-node/contracts'

import {
  createPlantProfileAction,
  type PlantProfileFormState,
  updatePlantProfileAction,
} from '@/app/plant-profiles/actions'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type PhaseKey = 'lightOn' | 'lightOff'
type RangeMetricKey = Exclude<keyof PhaseMetricsConfig, 'condensationMargin'>

const initialState: PlantProfileFormState = { error: null }

const rangeMetrics: {
  key: RangeMetricKey
  label: string
  unit: string
}[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'illuminance', label: 'Illuminance', unit: 'lx' },
  { key: 'estimatedPpfd', label: 'Estimated PPFD', unit: 'µmol/m²/s' },
  { key: 'vpd', label: 'VPD', unit: 'kPa' },
]

export function PlantProfileForm({
  initialValue,
  plantProfileId,
}: {
  initialValue: PlantProfileInput
  plantProfileId?: string
}) {
  const saveAction = plantProfileId
    ? updatePlantProfileAction.bind(null, plantProfileId)
    : createPlantProfileAction
  const [state, formAction, pending] = useActionState(saveAction, initialState)
  const isEditing = Boolean(plantProfileId)
  const cancelHref = plantProfileId
    ? `/plant-profiles/${plantProfileId}`
    : '/plant-profiles'

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>
            Name the profile and define when its light-on phase starts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <FormField className="sm:col-span-3" label="Profile name" name="name">
            <Input
              defaultValue={initialValue.name}
              id="name"
              maxLength={120}
              name="name"
              placeholder="e.g. Anubias low light"
              required
            />
          </FormField>
          <FormField label="Light starts" name="scheduleStart">
            <Input
              defaultValue={formatMinutesAsTime(
                initialValue.scheduleStartMinutes,
              )}
              id="scheduleStart"
              name="scheduleStart"
              required
              type="time"
            />
          </FormField>
          <FormField
            hint="1–1440 minutes"
            label="Light duration"
            name="scheduleDurationMinutes"
          >
            <Input
              defaultValue={initialValue.scheduleDurationMinutes}
              id="scheduleDurationMinutes"
              max={1440}
              min={1}
              name="scheduleDurationMinutes"
              required
              type="number"
            />
          </FormField>
        </CardContent>
      </Card>

      <PhaseFields
        description="Targets used while the grow light is on."
        phase="lightOn"
        title="Light on"
        value={initialValue.phaseConfig.lightOn}
      />
      <PhaseFields
        description="Targets used while the grow light is off."
        phase="lightOff"
        title="Light off"
        value={initialValue.phaseConfig.lightOff}
      />

      {state.error ? (
        <p
          aria-live="polite"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button disabled={pending} type="submit">
          {pending
            ? isEditing
              ? 'Saving…'
              : 'Creating…'
            : isEditing
              ? 'Save changes'
              : 'Create profile'}
        </Button>
      </div>
    </form>
  )
}

function PhaseFields({
  description,
  phase,
  title,
  value,
}: {
  description: string
  phase: PhaseKey
  title: string
  value: PhaseMetricsConfig
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid items-start gap-4 xl:grid-cols-2">
        {rangeMetrics.map((metric) => (
          <RangeMetricFields
            key={metric.key}
            config={value[metric.key]}
            label={metric.label}
            prefix={`${phase}.${metric.key}`}
            unit={metric.unit}
          />
        ))}
        <CondensationFields phase={phase} value={value.condensationMargin} />
      </CardContent>
    </Card>
  )
}

function RangeMetricFields({
  config,
  label,
  prefix,
  unit,
}: {
  config: MetricRangeConfig
  label: string
  prefix: string
  unit: string
}) {
  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-1 font-medium">
        {label}{' '}
        <span className="text-muted-foreground font-normal">({unit})</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          defaultValue={config.optimal[0]}
          label="Optimal minimum"
          name={`${prefix}.optimal.min`}
        />
        <NumberField
          defaultValue={config.optimal[1]}
          label="Optimal maximum"
          name={`${prefix}.optimal.max`}
        />
        <NumberField
          defaultValue={config.warning[0]}
          label="Warning minimum"
          name={`${prefix}.warning.min`}
        />
        <NumberField
          defaultValue={config.warning[1]}
          label="Warning maximum"
          name={`${prefix}.warning.max`}
        />
        <NumberField
          defaultValue={config.scale?.[0]}
          label="Scale minimum (optional)"
          name={`${prefix}.scale.min`}
          required={false}
        />
        <NumberField
          defaultValue={config.scale?.[1]}
          label="Scale maximum (optional)"
          name={`${prefix}.scale.max`}
          required={false}
        />
        <NumberField
          className="sm:col-span-2"
          defaultValue={config.settleMinutes}
          label="Settling time (minutes)"
          min={0}
          name={`${prefix}.settleMinutes`}
        />
      </div>
    </fieldset>
  )
}

function CondensationFields({
  phase,
  value,
}: {
  phase: PhaseKey
  value: PhaseMetricsConfig['condensationMargin']
}) {
  const prefix = `${phase}.condensationMargin`

  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-1 font-medium">
        Condensation margin{' '}
        <span className="text-muted-foreground font-normal">(°C)</span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          defaultValue={value.lowRiskMin}
          label="Low-risk minimum"
          name={`${prefix}.lowRiskMin`}
        />
        <NumberField
          defaultValue={value.mediumRiskMin}
          label="Medium-risk minimum"
          name={`${prefix}.mediumRiskMin`}
        />
        <NumberField
          defaultValue={value.scale[0]}
          label="Scale minimum"
          name={`${prefix}.scale.min`}
        />
        <NumberField
          defaultValue={value.scale[1]}
          label="Scale maximum"
          name={`${prefix}.scale.max`}
        />
        <NumberField
          className="sm:col-span-2"
          defaultValue={value.settleMinutes}
          label="Settling time (minutes)"
          min={0}
          name={`${prefix}.settleMinutes`}
        />
      </div>
    </fieldset>
  )
}

function NumberField({
  className,
  defaultValue,
  label,
  min,
  name,
  required = true,
}: {
  className?: string
  defaultValue?: number
  label: string
  min?: number
  name: string
  required?: boolean
}) {
  return (
    <FormField className={className} label={label} name={name}>
      <Input
        defaultValue={defaultValue}
        id={name}
        min={min}
        name={name}
        required={required}
        step="any"
        type="number"
      />
    </FormField>
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

function formatMinutesAsTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}
