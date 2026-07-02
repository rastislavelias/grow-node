const topicPrefix = 'grow-node'
const zonesPrefix = `${topicPrefix}/zones`

export const mqttTopics = {
  telemetry: (zoneId: string) => `${zonesPrefix}/${zoneId}/telemetry`,
  telemetryWildcard: `${zonesPrefix}/+/telemetry`,

  heartbeat: (zoneId: string) => `${zonesPrefix}/${zoneId}/heartbeat`,
  heartbeatWildcard: `${zonesPrefix}/+/heartbeat`,

  commands: (zoneId: string) => `${zonesPrefix}/${zoneId}/commands`,
  commandsWildcard: `${zonesPrefix}/+/commands`,

  commandAck: (zoneId: string) => `${zonesPrefix}/${zoneId}/command-ack`,
  commandAckWildcard: `${zonesPrefix}/+/command-ack`,
} as const
