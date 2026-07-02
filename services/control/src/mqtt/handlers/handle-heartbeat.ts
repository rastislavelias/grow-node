import { heartbeatPayloadSchema } from '@grow-node/contracts'
import { db, DeviceStatus, DeviceType } from '@grow-node/db'

import { parseJson } from '../../utils/parse-json.js'

function toDbDeviceStatus(status: 'online' | 'offline'): DeviceStatus {
  switch (status) {
    case 'online':
      return DeviceStatus.ONLINE
    case 'offline':
      return DeviceStatus.OFFLINE
  }
}

export async function handleHeartbeatMessage(message: Buffer) {
  const parsedJson = parseJson(message)
  const result = heartbeatPayloadSchema.safeParse(parsedJson)

  if (!result.success) {
    console.error('Invalid heartbeat payload', result.error.flatten())
    return
  }

  const heartbeat = result.data

  const zone = await db.zone.findUnique({
    where: {
      id: heartbeat.zoneId,
    },
    select: {
      id: true,
    },
  })

  if (!zone) {
    console.warn(`Heartbeat received for unknown zone: ${heartbeat.zoneId}`)
    return
  }

  const seenAt = new Date(heartbeat.seenAt)

  await db.device.upsert({
    where: {
      id: heartbeat.deviceId,
    },
    update: {
      zoneId: heartbeat.zoneId,
      firmwareVersion: heartbeat.firmwareVersion,
      lastSeenAt: seenAt,
    },
    create: {
      id: heartbeat.deviceId,
      zoneId: heartbeat.zoneId,
      name: `Device ${heartbeat.deviceId}`,
      type: DeviceType.SIMULATOR,
      firmwareVersion: heartbeat.firmwareVersion,
      lastSeenAt: seenAt,
    },
  })

  await db.deviceHeartbeat.create({
    data: {
      deviceId: heartbeat.deviceId,
      seenAt,
      status: toDbDeviceStatus(heartbeat.status),
    },
  })

  console.log('Stored heartbeat', {
    zoneId: heartbeat.zoneId,
    deviceId: heartbeat.deviceId,
    status: heartbeat.status,
  })
}
