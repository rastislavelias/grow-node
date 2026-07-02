export { mqttTopics } from './mqtt/topics.js'

export {
  telemetryPayloadSchema,
  type TelemetryPayload,
} from './mqtt/telemetry.js'

export {
  heartbeatPayloadSchema,
  type HeartbeatPayload,
} from './mqtt/heartbeat.js'

export {
  commandTypeSchema,
  setOutputPayloadSchema,
  commandPayloadSchema,
  type CommandType,
  type SetOutputPayload,
  type CommandPayload,
} from './mqtt/commands.js'

export {
  commandAckPayloadSchema,
  type CommandAckPayload,
} from './mqtt/command-ack.js'

export {
  deviceStatusSchema,
  commandStatusSchema,
  zoneStatusSchema,
  type DeviceStatus,
  type CommandStatus,
  type ZoneStatus,
} from './shared/status.js'
