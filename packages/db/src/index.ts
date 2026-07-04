export { db } from './client.js'

export {
  CommandSource,
  CommandStatus,
  CommandType,
  ControllerStatus,
  ControllerType,
  PrismaClient,
  ZonePhase,
  ZoneStatus,
} from './generated/prisma/client.js'

export type {
  Command,
  ControllerHeartbeat,
  PlantProfile,
  TelemetryReading,
  Zone,
  ZoneState,
} from './generated/prisma/client.js'
