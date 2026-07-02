import {
  commandPayloadSchema,
  mqttTopics,
  type CommandPayload,
} from '@grow-node/contracts'
import mqtt from 'mqtt'

import { env } from '../config/env.js'

const client = mqtt.connect(env.MQTT_URL)

client.on('connect', () => {
  console.log(`API MQTT publisher connected to ${env.MQTT_URL}`)
})

client.on('error', (error) => {
  console.error('API MQTT publisher error', error)
})

export async function publishCommand(command: CommandPayload): Promise<void> {
  const validatedCommand = commandPayloadSchema.parse(command)
  const topic = mqttTopics.commands(validatedCommand.zoneId)

  await new Promise<void>((resolve, reject) => {
    client.publish(topic, JSON.stringify(validatedCommand), (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

export function closeMqttPublisher(): void {
  client.end()
}
