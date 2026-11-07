import Fastify from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { registerPlantProfileRoutes } from './plant-profiles.js'

const dbMocks = vi.hoisted(() => ({
  deletePlantProfile: vi.fn(),
  findPlantProfile: vi.fn(),
}))

vi.mock('@grow-node/db', () => ({
  db: {
    plantProfile: {
      delete: dbMocks.deletePlantProfile,
      findUnique: dbMocks.findPlantProfile,
    },
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('DELETE /plant-profiles/:plantProfileId', () => {
  it('returns affected zones when the profile is in use', async () => {
    dbMocks.findPlantProfile.mockResolvedValue({
      id: 'profile-1',
      zones: [
        { id: 'zone-1', name: 'Anubias Zone 1' },
        { id: 'zone-2', name: 'Anubias Zone 2' },
      ],
    })

    const app = Fastify()
    await app.register(registerPlantProfileRoutes)

    const response = await app.inject({
      method: 'DELETE',
      url: '/plant-profiles/profile-1',
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      error: 'Plant profile is in use',
      code: 'PLANT_PROFILE_IN_USE',
      zones: [
        { id: 'zone-1', name: 'Anubias Zone 1' },
        { id: 'zone-2', name: 'Anubias Zone 2' },
      ],
    })
    expect(dbMocks.deletePlantProfile).not.toHaveBeenCalled()

    await app.close()
  })

  it('deletes a profile that is not assigned to a zone', async () => {
    dbMocks.findPlantProfile.mockResolvedValue({
      id: 'profile-1',
      zones: [],
    })
    dbMocks.deletePlantProfile.mockResolvedValue({
      id: 'profile-1',
    })

    const app = Fastify()
    await app.register(registerPlantProfileRoutes)

    const response = await app.inject({
      method: 'DELETE',
      url: '/plant-profiles/profile-1',
    })

    expect(response.statusCode).toBe(204)
    expect(dbMocks.deletePlantProfile).toHaveBeenCalledWith({
      where: {
        id: 'profile-1',
      },
    })

    await app.close()
  })
})
