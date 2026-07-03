import { mqttTopics } from '@grow-node/contracts'
import { db } from '@grow-node/db'
import mqtt from 'mqtt'

import { env } from './config/env.js'
import { createHealthServer } from './http/server.js'
import { handleCommandAckMessage } from './mqtt/handlers/handle-command-ack.js'
import { handleHeartbeatMessage } from './mqtt/handlers/handle-heartbeat.js'
import { handleTelemetryMessage } from './mqtt/handlers/handle-telemetry.js'

let mqttConnected = false

const client = mqtt.connect(env.MQTT_URL)

const healthServer = createHealthServer(() => ({
  service: 'control',
  status: mqttConnected ? 'ok' : 'degraded',
  checkedAt: new Date().toISOString(),
  dependencies: {
    mqtt: mqttConnected ? 'ok' : 'down',
  },
}))

await healthServer.listen({
  host: env.CONTROL_HOST,
  port: env.CONTROL_PORT,
})

function runHandler(handler: () => Promise<void>) {
  handler().catch((error: unknown) => {
    console.error('Control service handler failed', error)
  })
}

client.on('connect', () => {
  mqttConnected = true

  console.log(`Control service connected to ${env.MQTT_URL}`)

  client.subscribe(
    [
      mqttTopics.telemetryWildcard,
      mqttTopics.heartbeatWildcard,
      mqttTopics.commandAckWildcard,
    ],
    (error) => {
      if (error) {
        console.error('Failed to subscribe to MQTT topics', error)
        return
      }

      console.log('Subscribed to MQTT topics')
    },
  )
})

client.on('close', () => {
  mqttConnected = false
})

client.on('offline', () => {
  mqttConnected = false
})

client.on('message', (topic, message) => {
  if (topic.endsWith('/telemetry')) {
    runHandler(() => handleTelemetryMessage(message))
    return
  }

  if (topic.endsWith('/heartbeat')) {
    runHandler(() => handleHeartbeatMessage(message))
    return
  }

  if (topic.endsWith('/command-ack')) {
    runHandler(() => handleCommandAckMessage(message))
  }
})

client.on('error', (error) => {
  mqttConnected = false
  console.error('Control service MQTT error', error)
})

async function shutdown() {
  client.end(true)
  await healthServer.close()
  await db.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})

process.on('SIGTERM', () => {
  void shutdown()
})
