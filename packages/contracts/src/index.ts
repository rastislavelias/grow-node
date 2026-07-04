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
  controllerStatusSchema,
  zonePhaseSchema,
  zoneStatusSchema,
  type ControllerStatus,
  type ZonePhase,
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
  zoneStateReasonSchema,
  type ZoneOverview,
  type ZonesResponse,
  type ZoneStateReason,
} from './api/zones.js'

export {
  condensationMarginConfigSchema,
  metricRangeConfigSchema,
  numericRangeSchema,
  phaseConfigSchema,
  phaseMetricsConfigSchema,
  type CondensationMarginConfig,
  type MetricRangeConfig,
  type NumericRange,
  type PhaseConfig,
  type PhaseMetricsConfig,
} from './profiles/phase-config.js'
