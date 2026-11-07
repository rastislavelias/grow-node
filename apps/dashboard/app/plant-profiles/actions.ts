'use server'

import {
  plantProfileInputSchema,
  type PhaseMetricsConfig,
} from '@grow-node/contracts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  ApiRequestError,
  createPlantProfile,
  updatePlantProfile,
} from '@/lib/api'

type PhaseKey = 'lightOn' | 'lightOff'
type RangeMetricKey = Exclude<keyof PhaseMetricsConfig, 'condensationMargin'>

const rangeMetricKeys: RangeMetricKey[] = [
  'temperature',
  'humidity',
  'illuminance',
  'estimatedPpfd',
  'vpd',
]

export type PlantProfileFormState = {
  error: string | null
}

export async function createPlantProfileAction(
  _previousState: PlantProfileFormState,
  formData: FormData,
): Promise<PlantProfileFormState> {
  const input = parsePlantProfileFormData(formData)

  if (!input.success) {
    const issue = input.error.issues[0]
    const field = issue.path.join('.')

    return {
      error: `${field ? `${field}: ` : ''}${issue.message}`,
    }
  }

  let plantProfileId: string

  try {
    const { plantProfile } = await createPlantProfile(input.data)
    plantProfileId = plantProfile.id
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 409) {
      return { error: 'A plant profile with this name already exists.' }
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create plant profile.',
    }
  }

  revalidatePath('/plant-profiles')
  redirect(`/plant-profiles/${plantProfileId}`)
}

export async function updatePlantProfileAction(
  plantProfileId: string,
  _previousState: PlantProfileFormState,
  formData: FormData,
): Promise<PlantProfileFormState> {
  const input = parsePlantProfileFormData(formData)

  if (!input.success) {
    const issue = input.error.issues[0]
    const field = issue.path.join('.')

    return {
      error: `${field ? `${field}: ` : ''}${issue.message}`,
    }
  }

  try {
    await updatePlantProfile(plantProfileId, input.data)
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 409) {
      return { error: 'A plant profile with this name already exists.' }
    }

    if (error instanceof ApiRequestError && error.status === 404) {
      return { error: 'This plant profile no longer exists.' }
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update plant profile.',
    }
  }

  revalidatePath('/plant-profiles')
  revalidatePath(`/plant-profiles/${plantProfileId}`)
  redirect(`/plant-profiles/${plantProfileId}`)
}

function parsePlantProfileFormData(formData: FormData) {
  return plantProfileInputSchema.safeParse({
    name: stringField(formData, 'name'),
    scheduleStartMinutes: parseTime(stringField(formData, 'scheduleStart')),
    scheduleDurationMinutes: numberField(formData, 'scheduleDurationMinutes'),
    phaseConfig: {
      lightOn: readPhase(formData, 'lightOn'),
      lightOff: readPhase(formData, 'lightOff'),
    },
  })
}

function readPhase(formData: FormData, phase: PhaseKey) {
  const rangeMetrics = Object.fromEntries(
    rangeMetricKeys.map((metric) => [
      metric,
      readRangeMetric(formData, `${phase}.${metric}`),
    ]),
  )

  return {
    ...rangeMetrics,
    condensationMargin: {
      lowRiskMin: numberField(
        formData,
        `${phase}.condensationMargin.lowRiskMin`,
      ),
      mediumRiskMin: numberField(
        formData,
        `${phase}.condensationMargin.mediumRiskMin`,
      ),
      scale: readRange(formData, `${phase}.condensationMargin.scale`),
      settleMinutes: numberField(
        formData,
        `${phase}.condensationMargin.settleMinutes`,
      ),
    },
  }
}

function readRangeMetric(formData: FormData, prefix: string) {
  const scale = readOptionalRange(formData, `${prefix}.scale`)

  return {
    optimal: readRange(formData, `${prefix}.optimal`),
    warning: readRange(formData, `${prefix}.warning`),
    ...(scale ? { scale } : {}),
    settleMinutes: numberField(formData, `${prefix}.settleMinutes`),
  }
}

function readRange(formData: FormData, prefix: string) {
  return [
    numberField(formData, `${prefix}.min`),
    numberField(formData, `${prefix}.max`),
  ]
}

function readOptionalRange(formData: FormData, prefix: string) {
  const min = numberField(formData, `${prefix}.min`)
  const max = numberField(formData, `${prefix}.max`)

  return Number.isNaN(min) && Number.isNaN(max) ? undefined : [min, max]
}

function stringField(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

function numberField(formData: FormData, name: string) {
  const value = stringField(formData, name)
  return value === '' ? Number.NaN : Number(value)
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value)

  if (!match) {
    return Number.NaN
  }

  return Number(match[1]) * 60 + Number(match[2])
}
