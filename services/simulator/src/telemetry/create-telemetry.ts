import type { HeartbeatPayload, TelemetryPayload } from '@grow-node/contracts'

type SimulatorDevice = {
  zoneId: string
  deviceId: string
  firmwareVersion: string
}

export function createTelemetry(device: SimulatorDevice): TelemetryPayload {
  return {
    zoneId: device.zoneId,
    deviceId: device.deviceId,
    temperatureC: Number((22 + Math.random() * 6).toFixed(1)),
    humidityPct: Math.round(50 + Math.random() * 20),
    lightLux: Math.round(250 + Math.random() * 500),
    recordedAt: new Date().toISOString(),
  }
}

export function createHeartbeat(device: SimulatorDevice): HeartbeatPayload {
  return {
    zoneId: device.zoneId,
    deviceId: device.deviceId,
    status: 'online',
    firmwareVersion: device.firmwareVersion,
    seenAt: new Date().toISOString(),
  }
}
