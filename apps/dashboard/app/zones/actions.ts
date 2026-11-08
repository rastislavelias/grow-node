'use server'

import {
  assignPlantProfileRequestSchema,
  createZoneRequestSchema,
  updateZoneRequestSchema,
} from '@grow-node/contracts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  ApiRequestError,
  assignPlantProfile,
  createZone,
  updateZone,
} from '@/lib/api'

export type ZoneFormState = {
  error: string | null
}

export async function createZoneAction(
  _previousState: ZoneFormState,
  formData: FormData,
): Promise<ZoneFormState> {
  const firmwareVersion = formData.get('controllerFirmwareVersion')
  const input = createZoneRequestSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    controllerType: formData.get('controllerType'),
    controllerFirmwareVersion:
      typeof firmwareVersion === 'string' && firmwareVersion.trim() !== ''
        ? firmwareVersion
        : null,
    plantProfileId: formData.get('plantProfileId'),
  })

  if (!input.success) {
    const issue = input.error.issues[0]
    const field = issue.path.join('.')

    return {
      error: `${field ? `${field}: ` : ''}${issue.message}`,
    }
  }

  let zoneId: string

  try {
    const { zone } = await createZone(input.data)
    zoneId = zone.id
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 409) {
      return { error: 'A zone with this ID already exists.' }
    }

    if (error instanceof ApiRequestError && error.status === 404) {
      return { error: 'The selected plant profile no longer exists.' }
    }

    return {
      error: error instanceof Error ? error.message : 'Failed to create zone.',
    }
  }

  revalidatePath('/')
  revalidatePath('/plant-profiles')
  redirect(`/zones/${zoneId}`)
}

export async function updateZoneAction(
  zoneId: string,
  _previousState: ZoneFormState,
  formData: FormData,
): Promise<ZoneFormState> {
  const firmwareVersion = formData.get('controllerFirmwareVersion')
  const input = updateZoneRequestSchema.safeParse({
    name: formData.get('name'),
    controllerType: formData.get('controllerType'),
    controllerFirmwareVersion:
      typeof firmwareVersion === 'string' && firmwareVersion.trim() !== ''
        ? firmwareVersion
        : null,
    plantProfileId: formData.get('plantProfileId'),
  })

  if (!input.success) {
    const issue = input.error.issues[0]
    const field = issue.path.join('.')

    return {
      error: `${field ? `${field}: ` : ''}${issue.message}`,
    }
  }

  try {
    await updateZone(zoneId, input.data)
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return { error: 'The zone or selected plant profile no longer exists.' }
    }

    return {
      error: error instanceof Error ? error.message : 'Failed to update zone.',
    }
  }

  revalidatePath('/')
  revalidatePath('/plant-profiles')
  revalidatePath(`/zones/${zoneId}`)
  redirect(`/zones/${zoneId}`)
}

export type AssignPlantProfileState = {
  error: string | null
}

export async function assignPlantProfileAction(
  zoneId: string,
  _previousState: AssignPlantProfileState,
  formData: FormData,
): Promise<AssignPlantProfileState> {
  const input = assignPlantProfileRequestSchema.safeParse({
    plantProfileId: formData.get('plantProfileId'),
  })

  if (!input.success) {
    return { error: 'Select a valid plant profile.' }
  }

  try {
    await assignPlantProfile(zoneId, input.data)
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return { error: 'The zone or selected plant profile no longer exists.' }
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to assign plant profile.',
    }
  }

  revalidatePath('/plant-profiles')
  revalidatePath(`/zones/${zoneId}`)
  redirect(`/zones/${zoneId}`)
}
