import mqtt from 'mqtt'

import {
  heartbeatPayloadSchema,
  mqttTopics,
  telemetryPayloadSchema,
} from '@grow-node/contracts'

import { handleCommandMessage } from './commands/handle-command.js'
import { env } from './config/env.js'
import {
  createHeartbeat,
  createTelemetry,
} from './telemetry/create-telemetry.js'

const simulatedZone = {
  zoneId: 'zone-1',
  firmwareVersion: 'simulator-0.1.0',
} as const

const client = mqtt.connect(env.MQTT_URL)

client.on('connect', () => {
  console.log(`Simulator connected to ${env.MQTT_URL}`)

  const commandTopic = mqttTopics.commands(simulatedZone.zoneId)

  client.subscribe(commandTopic, (error) => {
    if (error) {
      console.error('Failed to subscribe to command topic', error)
      return
    }

    console.log(`Subscribed to ${commandTopic}`)
  })

  setInterval(() => {
    const telemetry = telemetryPayloadSchema.parse(
      createTelemetry(simulatedZone),
    )
    const heartbeat = heartbeatPayloadSchema.parse(
      createHeartbeat(simulatedZone),
    )

    client.publish(
      mqttTopics.telemetry(simulatedZone.zoneId),
      JSON.stringify(telemetry),
    )

    client.publish(
      mqttTopics.heartbeat(simulatedZone.zoneId),
      JSON.stringify(heartbeat),
    )

    console.log('Published telemetry', telemetry)
    console.log('Published heartbeat', heartbeat)
  }, env.SIMULATOR_INTERVAL_MS)
})

client.on('message', (topic, message) => {
  if (topic === mqttTopics.commands(simulatedZone.zoneId)) {
    handleCommandMessage(client, message)
  }
})

client.on('error', (error) => {
  console.error('Simulator MQTT error', error)
})
