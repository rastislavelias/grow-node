const topicPrefix = 'grow-node'

export const mqttTopics = {
  telemetry: (zoneId: string) => `${topicPrefix}/zones/${zoneId}/telemetry`,
  heartbeat: (zoneId: string) => `${topicPrefix}/zones/${zoneId}/heartbeat`,
  commands: (zoneId: string) => `${topicPrefix}/zones/${zoneId}/commands`,
  commandAck: (zoneId: string) => `${topicPrefix}/zones/${zoneId}/command-ack`,
} as const
