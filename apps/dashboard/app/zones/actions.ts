'use server'

import { assignPlantProfileRequestSchema } from '@grow-node/contracts'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ApiRequestError, assignPlantProfile } from '@/lib/api'

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
