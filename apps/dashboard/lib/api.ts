import {
  plantProfileResponseSchema,
  plantProfilesResponseSchema,
  systemHealthResponseSchema,
  zonesResponseSchema,
  zoneCommandsResponseSchema,
  zoneResponseSchema,
  zoneTelemetryResponseSchema,
  type PlantProfileResponse,
  type PlantProfilesResponse,
  type SystemHealthResponse,
  type ZonesResponse,
  type ZoneCommandsResponse,
  type ZoneResponse,
  type ZoneTelemetryResponse,
} from '@grow-node/contracts'

const apiBaseUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000'

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
