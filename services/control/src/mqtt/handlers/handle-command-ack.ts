import { commandAckPayloadSchema } from '@grow-node/contracts'
import { CommandStatus, db } from '@grow-node/db'

import { parseJson } from '../../utils/parse-json.js'

function toDbCommandStatus(status: 'acknowledged' | 'failed'): CommandStatus {
  switch (status) {
    case 'acknowledged':
      return CommandStatus.ACKNOWLEDGED
    case 'failed':
      return CommandStatus.FAILED
  }
}

export async function handleCommandAckMessage(message: Buffer) {
  const parsedJson = parseJson(message)
  const result = commandAckPayloadSchema.safeParse(parsedJson)

  if (!result.success) {
    console.error(
      'Invalid command acknowledgement payload',
      result.error.flatten(),
    )
    return
  }

  const acknowledgement = result.data

  try {
    await db.command.update({
      where: {
        id: acknowledgement.commandId,
      },
      data: {
        status: toDbCommandStatus(acknowledgement.status),
        acknowledgedAt: new Date(acknowledgement.acknowledgedAt),
      },
    })

    console.log('Updated command acknowledgement', {
      commandId: acknowledgement.commandId,
      status: acknowledgement.status,
    })
  } catch {
    console.warn(
      `Command acknowledgement received for unknown command: ${acknowledgement.commandId}`,
    )
  }
}
