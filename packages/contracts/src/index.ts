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

export {
  manualCommandRequestSchema,
  type ManualCommandRequest,
} from './api/commands.js'

export {
  systemHealthResponseSchema,
  type SystemHealthResponse,
} from './api/health.js'

export {
  zonesResponseSchema,
  zoneOverviewSchema,
  type ZoneOverview,
  type ZonesResponse,
} from './api/zones.js'
