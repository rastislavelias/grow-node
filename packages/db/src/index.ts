export { db } from './client.js'

export {
  CommandSource,
  CommandStatus,
  CommandType,
  DeviceStatus,
  DeviceType,
  PrismaClient,
  ZoneStatus,
  ZonePhase,
} from './generated/prisma/client.js'

export type {
  Command,
  Device,
  DeviceHeartbeat,
  PlantProfile,
  TelemetryReading,
  Zone,
  ZoneState,
} from './generated/prisma/client.js'
