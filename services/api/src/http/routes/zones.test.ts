import Fastify from 'fastify'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { registerZoneRoutes } from './zones.js'

const dbMocks = vi.hoisted(() => ({
  createZone: vi.fn(),
  deleteZone: vi.fn(),
  findPlantProfile: vi.fn(),
  findZone: vi.fn(),
  updateZone: vi.fn(),
}))

vi.mock('@grow-node/db', () => ({
  ControllerType: {
    ESP32: 'ESP32',
    SIMULATOR: 'SIMULATOR',
  },
  ZonePhase: {
    LIGHT_OFF: 'LIGHT_OFF',
  },
  ZoneStatus: {
    NORMAL: 'NORMAL',
  },
  db: {
    plantProfile: {
      findUnique: dbMocks.findPlantProfile,
    },
    zone: {
      create: dbMocks.createZone,
      delete: dbMocks.deleteZone,
      findUnique: dbMocks.findZone,
      update: dbMocks.updateZone,
    },
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('zone management routes', () => {
  it('creates a zone with its initial state', async () => {
    dbMocks.findZone.mockResolvedValue(null)
    dbMocks.findPlantProfile.mockResolvedValue({ id: 'profile-1' })
    dbMocks.createZone.mockResolvedValue({
      id: 'propagation-zone-1',
      name: 'Propagation Zone',
      controllerType: 'ESP32',
      controllerFirmwareVersion: 'esp32-1.0.0',
      plantProfileId: 'profile-1',
    })

    const app = Fastify()
    await app.register(registerZoneRoutes)

    const response = await app.inject({
      method: 'POST',
      url: '/zones',
      payload: {
        id: 'propagation-zone-1',
        name: 'Propagation Zone',
        controllerType: 'esp32',
        controllerFirmwareVersion: 'esp32-1.0.0',
        plantProfileId: 'profile-1',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      zone: {
        id: 'propagation-zone-1',
        name: 'Propagation Zone',
        controllerType: 'esp32',
        controllerFirmwareVersion: 'esp32-1.0.0',
        plantProfileId: 'profile-1',
      },
    })
    expect(dbMocks.createZone).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'propagation-zone-1',
          controllerType: 'ESP32',
          state: {
            create: {
              status: 'NORMAL',
              activePhase: 'LIGHT_OFF',
              fanDesired: false,
              lightDesired: false,
              heaterDesired: false,
              reasons: [],
            },
          },
        }),
      }),
    )

    await app.close()
  })

  it('rejects a duplicate zone ID', async () => {
    dbMocks.findZone.mockResolvedValue({ id: 'zone-1' })
    dbMocks.findPlantProfile.mockResolvedValue({ id: 'profile-1' })

    const app = Fastify()
    await app.register(registerZoneRoutes)

    const response = await app.inject({
      method: 'POST',
      url: '/zones',
      payload: {
        id: 'zone-1',
        name: 'Duplicate Zone',
        controllerType: 'simulator',
        controllerFirmwareVersion: null,
        plantProfileId: 'profile-1',
      },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({
      error: 'Zone ID already exists',
      code: 'ZONE_ID_CONFLICT',
    })
    expect(dbMocks.createZone).not.toHaveBeenCalled()

    await app.close()
  })

  it('updates editable zone configuration without changing its ID', async () => {
    dbMocks.findZone.mockResolvedValue({ id: 'zone-1' })
    dbMocks.findPlantProfile.mockResolvedValue({ id: 'profile-2' })
    dbMocks.updateZone.mockResolvedValue({
      id: 'zone-1',
      name: 'Updated Zone',
      controllerType: 'SIMULATOR',
      controllerFirmwareVersion: 'simulator-0.2.0',
      plantProfileId: 'profile-2',
    })

    const app = Fastify()
    await app.register(registerZoneRoutes)

    const response = await app.inject({
      method: 'PUT',
      url: '/zones/zone-1',
      payload: {
        name: 'Updated Zone',
        controllerType: 'simulator',
        controllerFirmwareVersion: 'simulator-0.2.0',
        plantProfileId: 'profile-2',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().zone.id).toBe('zone-1')
    expect(dbMocks.updateZone).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'zone-1' },
        data: {
          name: 'Updated Zone',
          controllerType: 'SIMULATOR',
          controllerFirmwareVersion: 'simulator-0.2.0',
          plantProfileId: 'profile-2',
        },
      }),
    )

    await app.close()
  })

  it('deletes a zone and its related records through database cascades', async () => {
    dbMocks.findZone.mockResolvedValue({ id: 'zone-1' })
    dbMocks.deleteZone.mockResolvedValue({ id: 'zone-1' })

    const app = Fastify()
    await app.register(registerZoneRoutes)

    const response = await app.inject({
      method: 'DELETE',
      url: '/zones/zone-1',
    })

    expect(response.statusCode).toBe(204)
    expect(dbMocks.deleteZone).toHaveBeenCalledWith({
      where: { id: 'zone-1' },
    })

    await app.close()
  })
})
