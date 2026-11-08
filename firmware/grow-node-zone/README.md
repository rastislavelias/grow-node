# Grow Node Zone Controller

ESP32 firmware for one Grow Node zone.

A **zone** is one independently controlled growing environment, such as a grow box, shelf section, cabinet, or grow tent. Each zone has one ESP32 controller that reads sensors, publishes telemetry and heartbeat messages over MQTT, and receives output commands from the backend.

---

## Hardware

- ESP32 DevKit / ESP-WROOM-32
- SHT30 / SHT31 temperature and humidity sensor
- BH1750 light sensor
- Relay or MOSFET outputs for:
  - Fan
  - Light
  - Heater

---

## Wiring

### I2C sensors

| Sensor | ESP32   |
| ------ | ------- |
| VCC    | 3.3V    |
| GND    | GND     |
| SDA    | GPIO 21 |
| SCL    | GPIO 22 |

### Outputs

Default output pins are configured in `config.h`:

| Output | Default GPIO |
| ------ | ------------ |
| Fan    | GPIO 23      |
| Light  | GPIO 19      |
| Heater | GPIO 27      |

Relay polarity can be changed with the `*_RELAY_ACTIVE_HIGH` values in `config.h`.

---

## Setup

### 1. Install PlatformIO

Use VS Code with the PlatformIO extension.

---

### 2. Install dependencies

Dependencies are defined in `platformio.ini`:

```ini
lib_deps =
  knolleary/PubSubClient
  adafruit/Adafruit SHT31 Library
  adafruit/Adafruit BusIO
  claws/BH1750
  bblanchon/ArduinoJson
```

---

### 3. Create configuration

Copy the example config:

```bash
cp src/config.example.h src/config.h
```

Edit `src/config.h`:

```cpp
#pragma once

// WiFi
static const char* WIFI_SSID = "YOUR_WIFI";
static const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// MQTT
static const char* MQTT_SERVER = "YOUR_MQTT_IP";
static const int MQTT_PORT = 1883;

// Zone/controller
static const char* ZONE_ID = "esp32-zone-1";
static const char* FIRMWARE_VERSION = "esp32-0.1.0";

// I2C
static const int SDA_PIN = 21;
static const int SCL_PIN = 22;

// Fan
static const int FAN_PIN = 23;
static const bool FAN_RELAY_ACTIVE_HIGH = true;

// Light
static const int LIGHT_PIN = 19;
static const bool LIGHT_RELAY_ACTIVE_HIGH = true;

// Heater
static const int HEATER_PIN = 27;
static const bool HEATER_RELAY_ACTIVE_HIGH = true;
```

`src/config.h` contains private WiFi details, so it should not be committed.

---

## Zone ID

The backend identifies each controller by `ZONE_ID`.

Example:

```cpp
static const char* ZONE_ID = "esp32-zone-1";
```

The controller ID must already exist in the backend. Before uploading the firmware:

- open the local dashboard;
- create a zone with controller type `ESP32`;
- copy its exact ID into `ZONE_ID`.

The default `zone-1` ID is reserved for the simulator. A physical controller can use a distinct ID such as `esp32-zone-1`.

---

## MQTT topics

The firmware uses the current Grow Node MQTT contract:

```txt
grow-node/zones/{zoneId}/telemetry
grow-node/zones/{zoneId}/heartbeat
grow-node/zones/{zoneId}/commands
grow-node/zones/{zoneId}/command-ack
```

Example for `esp32-zone-1`:

```txt
grow-node/zones/esp32-zone-1/telemetry
grow-node/zones/esp32-zone-1/heartbeat
grow-node/zones/esp32-zone-1/commands
grow-node/zones/esp32-zone-1/command-ack
```

---

## Telemetry payload

The ESP32 publishes telemetry to:

```txt
grow-node/zones/{zoneId}/telemetry
```

Example:

```json
{
  "zoneId": "esp32-zone-1",
  "temperatureC": 23.9,
  "humidityPct": 91.4,
  "lightLux": 420,
  "recordedAt": "2026-07-04T18:32:00Z"
}
```

Required fields:

- `zoneId`
- `temperatureC`
- `humidityPct`
- `lightLux`
- `recordedAt`

If a required sensor read fails, telemetry is skipped instead of publishing `null` values.

Derived metrics such as VPD, estimated PPFD, and condensation margin are handled by the backend/dashboard model, not by the firmware.

---

## Heartbeat payload

The ESP32 publishes heartbeat messages to:

```txt
grow-node/zones/{zoneId}/heartbeat
```

Example:

```json
{
  "zoneId": "esp32-zone-1",
  "status": "online",
  "firmwareVersion": "esp32-0.1.0",
  "seenAt": "2026-07-04T18:32:00Z"
}
```

The backend uses heartbeat messages to decide whether the zone controller is online or stale.

---

## Commands

The ESP32 subscribes to:

```txt
grow-node/zones/{zoneId}/commands
```

Example command:

```json
{
  "commandId": "cmd_123",
  "zoneId": "esp32-zone-1",
  "type": "set-output",
  "payload": {
    "fan": true,
    "light": false,
    "heater": false
  },
  "createdAt": "2026-07-04T18:32:00Z"
}
```

Supported command type:

```txt
set-output
```

The payload controls:

- Fan
- Light
- Heater

---

## Command acknowledgement

After applying a command, the ESP32 publishes an acknowledgement to:

```txt
grow-node/zones/{zoneId}/command-ack
```

Example success acknowledgement:

```json
{
  "commandId": "cmd_123",
  "zoneId": "esp32-zone-1",
  "status": "acknowledged",
  "acknowledgedAt": "2026-07-04T18:32:01Z"
}
```

Example failed acknowledgement:

```json
{
  "commandId": "cmd_123",
  "zoneId": "esp32-zone-1",
  "status": "failed",
  "acknowledgedAt": "2026-07-04T18:32:01Z",
  "message": "Invalid set-output payload"
}
```

---

## First upload with USB

You must upload once via USB before OTA works.

In `platformio.ini`, disable OTA:

```ini
; upload_protocol = espota
; upload_port = 192.168.1.132
```

Upload:

```bash
pio run -t upload
```

Open Serial Monitor and note the ESP32 IP address:

```bash
pio device monitor
```

---

## OTA upload over WiFi

After the first USB upload, enable OTA in `platformio.ini`:

```ini
upload_protocol = espota
upload_port = 192.168.1.132
```

Replace `192.168.1.132` with the ESP32 IP address shown in Serial Monitor.

Upload:

```bash
pio run -t upload
```

---

## Local backend requirements

The ESP32 must connect to the MQTT broker using the host machine LAN IP address.

Do not use:

```txt
localhost
postgres
mosquitto
api
```

Those names only work inside Docker.

Use your computer’s local network IP, for example:

```cpp
static const char* MQTT_SERVER = "192.168.1.96";
```

Docker Compose must expose Mosquitto on port `1883`:

```yaml
ports:
  - '1883:1883'
```

---

## Testing with backend

Start the backend stack:

```bash
docker compose up --build
```

Watch control service logs:

```bash
docker compose logs -f control
```

Expected logs after the ESP32 connects:

```txt
Stored heartbeat for esp32-zone-1
Stored telemetry for esp32-zone-1
```

The dashboard should then show:

```txt
Zones online 2/2
```

assuming the simulator is also running for `zone-1`.
