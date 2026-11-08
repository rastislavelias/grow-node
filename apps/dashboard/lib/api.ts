import {
  assignPlantProfileRequestSchema,
  createZoneRequestSchema,
  plantProfileResponseSchema,
  plantProfileInUseResponseSchema,
  plantProfilesResponseSchema,
  systemHealthResponseSchema,
  zonesResponseSchema,
  zoneCommandsResponseSchema,
  zoneConfigurationResponseSchema,
  zoneResponseSchema,
  zonePlantProfileAssignmentResponseSchema,
  zoneTelemetryResponseSchema,
  type AssignPlantProfileRequest,
  type CreateZoneRequest,
  type PlantProfileInput,
  type PlantProfileInUseResponse,
  type PlantProfileResponse,
  type PlantProfilesResponse,
  type SystemHealthResponse,
  type ZonesResponse,
  type ZoneCommandsResponse,
  type ZoneConfigurationResponse,
  type ZoneResponse,
  type ZonePlantProfileAssignmentResponse,
  type ZoneTelemetryResponse,
} from '@grow-node/contracts'

const apiBaseUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data?: unknown,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export async function getZones(): Promise<ZonesResponse> {
  const response = await fetch(`${apiBaseUrl}/zones`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch zones')
  }

  const data: unknown = await response.json()

  return zonesResponseSchema.parse(data)
}

export async function createZone(
  input: CreateZoneRequest,
): Promise<ZoneConfigurationResponse> {
  const body = createZoneRequestSchema.parse(input)
  const response = await fetch(`${apiBaseUrl}/zones`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null)
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Failed to create zone'

    throw new ApiRequestError(message, response.status, data)
  }

  const data: unknown = await response.json()

  return zoneConfigurationResponseSchema.parse(data)
}

export async function getPlantProfiles(): Promise<PlantProfilesResponse> {
  const response = await fetch(`${apiBaseUrl}/plant-profiles`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch plant profiles')
  }

  const data: unknown = await response.json()

  return plantProfilesResponseSchema.parse(data)
}

export async function getPlantProfile(
  plantProfileId: string,
): Promise<PlantProfileResponse> {
  const response = await fetch(
    `${apiBaseUrl}/plant-profiles/${plantProfileId}`,
    {
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch plant profile')
  }

  const data: unknown = await response.json()

  return plantProfileResponseSchema.parse(data)
}

export async function createPlantProfile(
  input: PlantProfileInput,
): Promise<PlantProfileResponse> {
  const response = await fetch(`${apiBaseUrl}/plant-profiles`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null)
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Failed to create plant profile'

    throw new ApiRequestError(message, response.status, data)
  }

  const data: unknown = await response.json()

  return plantProfileResponseSchema.parse(data)
}

export async function updatePlantProfile(
  plantProfileId: string,
  input: PlantProfileInput,
): Promise<PlantProfileResponse> {
  const response = await fetch(
    `${apiBaseUrl}/plant-profiles/${plantProfileId}`,
    {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  )

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null)
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Failed to update plant profile'

    throw new ApiRequestError(message, response.status, data)
  }

  const data: unknown = await response.json()

  return plantProfileResponseSchema.parse(data)
}

export async function deletePlantProfile(
  plantProfileId: string,
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/plant-profiles/${plantProfileId}`,
    {
      method: 'DELETE',
    },
  )

  if (response.ok) {
    return
  }

  const data: unknown = await response.json().catch(() => null)
  const message =
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof data.error === 'string'
      ? data.error
      : 'Failed to delete plant profile'

  throw new ApiRequestError(message, response.status, data)
}

export async function assignPlantProfile(
  zoneId: string,
  input: AssignPlantProfileRequest,
): Promise<ZonePlantProfileAssignmentResponse> {
  const body = assignPlantProfileRequestSchema.parse(input)
  const response = await fetch(`${apiBaseUrl}/zones/${zoneId}/plant-profile`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null)
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Failed to assign plant profile'

    throw new ApiRequestError(message, response.status, data)
  }

  const data: unknown = await response.json()

  return zonePlantProfileAssignmentResponseSchema.parse(data)
}

export function getPlantProfileInUseError(
  error: ApiRequestError,
): PlantProfileInUseResponse | null {
  const result = plantProfileInUseResponseSchema.safeParse(error.data)
  return result.success ? result.data : null
}

export async function getSystemHealth(): Promise<SystemHealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch system health')
  }

  const data: unknown = await response.json()

  return systemHealthResponseSchema.parse(data)
}

export async function getZone(zoneId: string): Promise<ZoneResponse> {
  const response = await fetch(`${apiBaseUrl}/zones/${zoneId}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch zone')
  }

  const data: unknown = await response.json()

  return zoneResponseSchema.parse(data)
}

export async function getZoneTelemetry(
  zoneId: string,
): Promise<ZoneTelemetryResponse> {
  const response = await fetch(`${apiBaseUrl}/zones/${zoneId}/telemetry`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch zone telemetry')
  }

  const data: unknown = await response.json()

  return zoneTelemetryResponseSchema.parse(data)
}

export async function getZoneCommands(
  zoneId: string,
): Promise<ZoneCommandsResponse> {
  const response = await fetch(`${apiBaseUrl}/zones/${zoneId}/commands`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch zone commands')
  }

  const data: unknown = await response.json()

  return zoneCommandsResponseSchema.parse(data)
}
