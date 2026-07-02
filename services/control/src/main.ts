import { db } from '@grow-node/db'
import { mqttTopics } from '@grow-node/contracts'
import mqtt from 'mqtt'

import { env } from './config/env.js'
import { handleCommandAckMessage } from './mqtt/handlers/handle-command-ack.js'
import { handleHeartbeatMessage } from './mqtt/handlers/handle-heartbeat.js'
import { handleTelemetryMessage } from './mqtt/handlers/handle-telemetry.js'

const client = mqtt.connect(env.MQTT_URL)

function runHandler(handler: () => Promise<void>) {
  handler().catch((error: unknown) => {
    console.error('Control service handler failed', error)
  })
}

client.on('connect', () => {
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
  console.error('Control service MQTT error', error)
})

process.on('SIGINT', () => {
  client.end(true, () => {
    db.$disconnect()
      .catch((error: unknown) => {
        console.error('Failed to disconnect from database', error)
      })
      .finally(() => {
        process.exit(0)
      })
  })
})
