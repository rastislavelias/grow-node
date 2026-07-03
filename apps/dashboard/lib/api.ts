import {
  systemHealthResponseSchema,
  type SystemHealthResponse,
  zonesResponseSchema,
  type ZonesResponse,
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
