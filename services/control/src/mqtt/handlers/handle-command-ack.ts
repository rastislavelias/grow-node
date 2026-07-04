import { commandAckPayloadSchema } from '@grow-node/contracts'
import { CommandStatus as DbCommandStatus, db } from '@grow-node/db'

const commandStatusMap = {
  acknowledged: DbCommandStatus.ACKNOWLEDGED,
  failed: DbCommandStatus.FAILED,
} as const

export async function handleCommandAckMessage(message: Buffer) {
  const payload = commandAckPayloadSchema.parse(JSON.parse(message.toString()))

  const result = await db.command.updateMany({
    where: {
      id: payload.commandId,
      zoneId: payload.zoneId,
    },
    data: {
      status: commandStatusMap[payload.status],
      acknowledgedAt: new Date(payload.acknowledgedAt),
    },
  })

  if (result.count === 0) {
    console.warn(`Ignoring ack for unknown command: ${payload.commandId}`)
    return
  }

  console.log(`Stored command ack for ${payload.commandId}`)
}
