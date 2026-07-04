import { heartbeatPayloadSchema } from '@grow-node/contracts'
import { ControllerStatus as DbControllerStatus, db } from '@grow-node/db'

const controllerStatusMap = {
  online: DbControllerStatus.ONLINE,
  offline: DbControllerStatus.OFFLINE,
} as const

export async function handleHeartbeatMessage(message: Buffer) {
  const payload = heartbeatPayloadSchema.parse(JSON.parse(message.toString()))

  const zone = await db.zone.findUnique({
    where: {
      id: payload.zoneId,
    },
  })

  if (!zone) {
    console.warn(`Ignoring heartbeat for unknown zone: ${payload.zoneId}`)
    return
  }

  const seenAt = new Date(payload.seenAt)

  await db.$transaction([
    db.zone.update({
      where: {
        id: payload.zoneId,
      },
      data: {
        controllerLastSeenAt: seenAt,
        controllerFirmwareVersion:
          payload.firmwareVersion ?? zone.controllerFirmwareVersion,
      },
    }),
    db.controllerHeartbeat.create({
      data: {
        zoneId: payload.zoneId,
        seenAt,
        status: controllerStatusMap[payload.status],
        firmwareVersion: payload.firmwareVersion ?? null,
      },
    }),
  ])

  console.log(`Stored heartbeat for ${payload.zoneId}`)
}
