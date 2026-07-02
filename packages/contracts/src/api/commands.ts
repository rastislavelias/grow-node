import { z } from 'zod'

import { setOutputPayloadSchema } from '../mqtt/commands.js'

export const manualCommandRequestSchema = setOutputPayloadSchema
export type ManualCommandRequest = z.infer<typeof manualCommandRequestSchema>
