import {
  commandAckPayloadSchema,
  commandPayloadSchema,
  mqttTopics,
  type CommandAckPayload,
} from '@grow-node/contracts'
import type { MqttClient } from 'mqtt'

function parseJson(value: Buffer): unknown {
  return JSON.parse(value.toString('utf8')) as unknown
}

export function handleCommandMessage(client: MqttClient, message: Buffer) {
  const parsedJson = parseJson(message)
  const result = commandPayloadSchema.safeParse(parsedJson)

  if (!result.success) {
    console.error('Invalid command payload', result.error.flatten())
    return
  }

  const command = result.data

  console.log('Received command', command)

  const acknowledgement: CommandAckPayload = {
    commandId: command.commandId,
    zoneId: command.zoneId,
    status: 'acknowledged',
    acknowledgedAt: new Date().toISOString(),
  }

  const validatedAck = commandAckPayloadSchema.parse(acknowledgement)
  const topic = mqttTopics.commandAck(command.zoneId)

  client.publish(topic, JSON.stringify(validatedAck))

  console.log('Published command acknowledgement', validatedAck)
}
