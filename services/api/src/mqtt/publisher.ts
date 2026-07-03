import {
  commandPayloadSchema,
  mqttTopics,
  type CommandPayload,
} from '@grow-node/contracts'
import mqtt from 'mqtt'

import { env } from '../config/env.js'

let mqttConnected = false

const client = mqtt.connect(env.MQTT_URL)

client.on('connect', () => {
  mqttConnected = true
  console.log(`API MQTT publisher connected to ${env.MQTT_URL}`)
})

client.on('close', () => {
  mqttConnected = false
})

client.on('offline', () => {
  mqttConnected = false
})

client.on('error', (error) => {
  mqttConnected = false
  console.error('API MQTT publisher error', error)
})

export function isMqttPublisherConnected(): boolean {
  return mqttConnected
}

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
