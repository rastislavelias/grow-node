import { z } from 'zod'

import { phaseConfigSchema } from '../profiles/phase-config.js'

export const plantProfileInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    scheduleStartMinutes: z.number().int().min(0).max(1439),
    scheduleDurationMinutes: z.number().int().min(1).max(1440),
    phaseConfig: phaseConfigSchema,
  })
  .strict()

export const createPlantProfileRequestSchema = plantProfileInputSchema
export const updatePlantProfileRequestSchema = plantProfileInputSchema

export const plantProfileZoneReferenceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .strict()

export const plantProfileSchema = plantProfileInputSchema
  .extend({
    id: z.string(),
    zones: z.array(plantProfileZoneReferenceSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict()

export const plantProfilesResponseSchema = z
  .object({
    plantProfiles: z.array(plantProfileSchema),
  })
  .strict()

export const plantProfileResponseSchema = z
  .object({
    plantProfile: plantProfileSchema,
  })
  .strict()

export const assignPlantProfileRequestSchema = z
  .object({
    plantProfileId: z.string().min(1),
  })
  .strict()

export const zonePlantProfileAssignmentResponseSchema = z
  .object({
    zone: plantProfileZoneReferenceSchema.extend({
      plantProfileId: z.string(),
    }),
  })
  .strict()

export const plantProfileInUseResponseSchema = z
  .object({
    error: z.literal('Plant profile is in use'),
    code: z.literal('PLANT_PROFILE_IN_USE'),
    zones: z.array(plantProfileZoneReferenceSchema).min(1),
  })
  .strict()

export type PlantProfileInput = z.infer<typeof plantProfileInputSchema>
export type PlantProfile = z.infer<typeof plantProfileSchema>
export type PlantProfilesResponse = z.infer<typeof plantProfilesResponseSchema>
export type PlantProfileResponse = z.infer<typeof plantProfileResponseSchema>
export type AssignPlantProfileRequest = z.infer<
  typeof assignPlantProfileRequestSchema
>
export type ZonePlantProfileAssignmentResponse = z.infer<
  typeof zonePlantProfileAssignmentResponseSchema
>
export type PlantProfileInUseResponse = z.infer<
  typeof plantProfileInUseResponseSchema
>
