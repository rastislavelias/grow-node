import { z } from 'zod'

export const numericRangeSchema = z
  .tuple([z.number(), z.number()])
  .refine(([min, max]) => min <= max, {
    message: 'Range minimum must be less than or equal to maximum',
  })

export const metricRangeConfigSchema = z
  .object({
    optimal: numericRangeSchema,
    warning: numericRangeSchema,
    scale: numericRangeSchema.optional(),
    settleMinutes: z.number().int().nonnegative(),
  })
  .strict()

export const condensationMarginConfigSchema = z
  .object({
    lowRiskMin: z.number(),
    mediumRiskMin: z.number(),
    scale: numericRangeSchema,
    settleMinutes: z.number().int().nonnegative(),
  })
  .strict()
  .superRefine((config, context) => {
    if (config.mediumRiskMin > config.lowRiskMin) {
      context.addIssue({
        code: 'custom',
        message:
          'Medium-risk minimum must be less than or equal to low-risk minimum',
        path: ['mediumRiskMin'],
      })
    }

    if (config.scale[0] >= config.mediumRiskMin) {
      context.addIssue({
        code: 'custom',
        message: 'Scale minimum must be below medium-risk minimum',
        path: ['scale', 0],
      })
    }

    if (config.scale[1] <= config.lowRiskMin) {
      context.addIssue({
        code: 'custom',
        message: 'Scale maximum must be above low-risk minimum',
        path: ['scale', 1],
      })
    }
  })

export const phaseMetricsConfigSchema = z
  .object({
    condensationMargin: condensationMarginConfigSchema,
    estimatedPpfd: metricRangeConfigSchema,
    humidity: metricRangeConfigSchema,
    illuminance: metricRangeConfigSchema,
    temperature: metricRangeConfigSchema,
    vpd: metricRangeConfigSchema,
  })
  .strict()

export const phaseConfigSchema = z
  .object({
    lightOn: phaseMetricsConfigSchema,
    lightOff: phaseMetricsConfigSchema,
  })
  .strict()

export type NumericRange = z.infer<typeof numericRangeSchema>
export type MetricRangeConfig = z.infer<typeof metricRangeConfigSchema>
export type CondensationMarginConfig = z.infer<
  typeof condensationMarginConfigSchema
>
export type PhaseMetricsConfig = z.infer<typeof phaseMetricsConfigSchema>
export type PhaseConfig = z.infer<typeof phaseConfigSchema>
