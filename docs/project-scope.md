# Grow Node – Project Scope

## 1. Project title

**Grow Node**

A local-first IoT grow monitoring system with ESP32 firmware, MQTT communication, a Node.js control service, a dashboard-facing API service, PostgreSQL storage, simulated telemetry, and a Next.js dashboard.

---

## 2. Project purpose

Grow Node is a portfolio-quality technical project designed to demonstrate a complete IoT-style system.

The system collects environmental data from grow zones, sends the data through MQTT, processes it through backend services, stores telemetry and state in PostgreSQL, and displays the result in a web dashboard.

The public version must be easy to run locally without physical hardware by using a simulator service.

The goal is not to build a production IoT platform. The goal is to build a clear, runnable, well-structured system that shows architecture, backend data flow, MQTT communication, Docker-based development, database persistence, frontend presentation, and basic testing.

---

## 3. Main goal

A reviewer should be able to clone the repository, run one command, open the dashboard, and see simulated grow-zone data flowing through the system.

Target local command:

```bash
docker compose up --build
```

Expected local flow:

```txt
simulator -> MQTT broker -> control service -> PostgreSQL -> API service -> dashboard
```

The project should feel like a real system, but it does not need to be production-ready.

---

## 4. Project type

Monorepo containing:

- Next.js dashboard
- Node.js API service
- Node.js control service
- Node.js simulator service
- Shared contracts package
- Shared database package
- ESP32 firmware project
- Docker Compose infrastructure
- Project documentation
- Small practical test suite

---

## 5. Runtime architecture

### Local demo architecture

```txt
ESP32 firmware or simulator
  ↓ publishes telemetry over MQTT

Mosquitto MQTT broker
  ↓ telemetry / heartbeat / command acknowledgement messages

Control service
  ↓ validates messages
  ↓ stores telemetry
  ↓ updates latest zone state
  ↓ evaluates control decisions

PostgreSQL database
  ↑ reads dashboard data
  ↑ stores commands, readings, device state, and zone state

API service
  ↑ reads from PostgreSQL
  ↓ publishes manual commands to MQTT when requested

Next.js dashboard
  ↓ communicates with API service over HTTP
```

### Read flow

```txt
dashboard -> API service -> PostgreSQL
```

The dashboard does not access the database directly.

### Telemetry flow

```txt
simulator or ESP32 -> MQTT -> control service -> PostgreSQL
```

The control service owns telemetry ingestion.

### Manual command flow

```txt
dashboard -> API service -> PostgreSQL
dashboard -> API service -> MQTT command topic
MQTT command topic -> simulator or ESP32
simulator or ESP32 -> MQTT command acknowledgement topic
command acknowledgement topic -> control service -> PostgreSQL
```

Manual control is allowed, but only in a simple form.

---

## 6. Demo mode

The simulator behaves like fake ESP32 hardware.

It publishes telemetry and heartbeat messages to MQTT topics. The control service consumes those messages, validates them, saves telemetry to PostgreSQL, evaluates zone state, and may publish automatic commands.

The dashboard reads data through the API service and displays the current system state.

The project must work without real ESP32 hardware.

---

## 7. Real hardware mode

The ESP32 firmware can be flashed to a real board separately.

The firmware should publish the same MQTT payloads as the simulator so the rest of the system does not need to change.

The firmware is included in the monorepo to show the real hardware side of the project, but it is not required for the local demo.

---

## 8. Repository structure

```txt
grow-node/
  README.md
  compose.yml
  .env.example
  .gitignore
  .dockerignore
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json

  .vscode/
    extensions.json
    settings.json

  .cursor/
    rules/
      grow-node.mdc

  apps/
    dashboard/

  services/
    api/
    control/
    simulator/

  packages/
    contracts/
    db/

  firmware/
    grow-node-zone/

  infra/
    mosquitto/
    postgres/

  docs/
    project-scope.md
    architecture.md
    local-development.md
    mqtt-topics.md
    api.md
    hardware.md
    wiring.md
    testing.md
    ai-usage.md
```

---

## 9. Workspace structure

The following folders are part of the pnpm workspace:

```txt
apps/*
services/*
packages/*
```

The firmware folder is not part of the pnpm workspace.

The ESP32 firmware is kept in the same repository for completeness, but it is built and flashed separately using PlatformIO.

---

## 10. Main services and responsibilities

## 10.1 Dashboard app

Location:

```txt
apps/dashboard
```

Technology:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS (shadcn)

Responsibilities:

- Display zone overview
- Display latest telemetry per zone
- Display latest evaluated zone state
- Display device heartbeat status
- Display recent telemetry history
- Display recent command history
- Allow simple manual fan/light commands after the read-only flow works
- Show clear loading, empty, and error states
- Communicate only with the API service over HTTP

The dashboard must not:

- Access PostgreSQL directly
- Import Prisma
- Connect directly to MQTT
- Contain control-service decision logic
- Contain firmware-specific logic

The dashboard is a presentation layer and control surface.

---

## 10.2 API service

Location:

```txt
services/api
```

Technology:

- Node.js
- TypeScript
- Fastify
- Zod
- Prisma/PostgreSQL
- MQTT publisher

Responsibilities:

- Expose HTTP endpoints for the dashboard
- Validate request bodies and params with Zod
- Read zone data from PostgreSQL
- Read telemetry history from PostgreSQL
- Read latest zone state from PostgreSQL
- Read command history from PostgreSQL
- Create manual command records
- Publish manual fan/light commands to MQTT
- Return clear API errors
- Expose a health endpoint

The API service owns dashboard-facing HTTP access.

The API service does not consume telemetry from MQTT. Telemetry ingestion belongs to the control service.

---

## 10.3 Control service

Location:

```txt
services/control
```

Technology:

- Node.js
- TypeScript
- MQTT client
- Zod
- Prisma/PostgreSQL
- Optional Fastify health endpoint only if needed

Responsibilities:

- Connect to the MQTT broker
- Subscribe to telemetry topics
- Subscribe to heartbeat topics
- Subscribe to command acknowledgement topics
- Validate incoming MQTT payloads with shared Zod schemas
- Store telemetry readings in PostgreSQL
- Update latest zone state
- Evaluate plant profile thresholds
- Decide desired fan/light state
- Publish automatic commands when required
- Track command status and acknowledgements
- Track device heartbeat status
- Expose a health endpoint if useful for Docker or debugging

The control service is the brain of the system.

The control service may write directly to the database because telemetry ingestion and zone evaluation are its responsibility.

---

## 10.4 Simulator service

Location:

```txt
services/simulator
```

Technology:

- Plain Node.js
- TypeScript
- MQTT client
- Zod contracts for payload shape

Responsibilities:

- Connect to the MQTT broker
- Simulate one or more grow zones
- Publish fake telemetry at regular intervals
- Publish fake device heartbeat messages
- Listen for command messages
- Publish fake command acknowledgements
- Support simple scenarios such as normal conditions, or high temperature

The simulator behaves like fake ESP32 hardware.

The simulator should not expose an HTTP API in the first version.

---

## 10.5 Contracts package

Location:

```txt
packages/contracts
```

Technology:

- TypeScript
- Zod

Responsibilities:

- Define MQTT topic builders
- Define MQTT payload schemas
- Define API request schemas
- Define API response schemas where useful
- Export TypeScript types inferred from Zod schemas
- Provide shared enums and status values
- Prevent duplicated types across apps and services

Suggested structure:

```txt
packages/contracts/
  src/
    mqtt/
      topics.ts
      telemetry.ts
      heartbeat.ts
      commands.ts
      command-ack.ts

    api/
      zones.ts
      telemetry.ts
      commands.ts

    shared/
      ids.ts
      status.ts

    index.ts

  test/
    telemetry.test.ts
    commands.test.ts
```

Contract rules:

- External message shapes belong in `packages/contracts`
- MQTT topic names belong in `packages/contracts`
- API request and response contracts belong in `packages/contracts`
- Local component props do not belong in `packages/contracts`
- Prisma models do not replace API/MQTT contracts
- Shared types should be inferred from Zod schemas where possible

Example pattern:

```ts
import { z } from 'zod'

export const telemetryPayloadSchema = z.object({
  zoneId: z.string().min(1),
  deviceId: z.string().min(1),
  temperatureC: z.number(),
  humidityPct: z.number().min(0).max(100),
  lightLux: z.number().min(0),
  recordedAt: z.string().datetime(),
})

export type TelemetryPayload = z.infer<typeof telemetryPayloadSchema>
```

---

## 10.6 Database package

Location:

```txt
packages/db
```

Technology:

- Prisma
- PostgreSQL

Responsibilities:

- Own the Prisma schema
- Export the Prisma client
- Provide shared database access for backend services
- Keep database setup consistent across the project

The database package may be used by:

- `services/api`
- `services/control`

The database package must not be used directly by:

- `apps/dashboard`
- `services/simulator`
- `firmware/grow-node-zone`

The database package should not contain dashboard UI logic or MQTT decision logic.

---

## 10.7 Firmware project

Location:

```txt
firmware/grow-node-zone
```

Technology:

- C++
- PlatformIO
- ESP32

Responsibilities:

- Read sensor values from connected hardware
- Publish telemetry to MQTT
- Publish heartbeat messages
- Subscribe to command topics
- Apply received commands to outputs such as fan/light relays
- Publish command acknowledgements
- Follow the same MQTT contract documented in the repo

The firmware is included to show the real hardware side of the system, but the local demo must work without hardware.

---

## 11. Database choice

The first public version uses PostgreSQL.

Reasons:

- The project contains relational app data, not only raw sensor events
- Zones, devices, plant profiles, telemetry readings, commands, and state are related
- PostgreSQL is easy to run locally with Docker
- Prisma works well with PostgreSQL
- The data model is easier to explain in a portfolio review than a NoSQL access-pattern design

DynamoDB, AWS Timestream, and other cloud databases are out of scope for the first version.

---

## 12. Initial database entities

The initial schema should include only what is needed for the local demo.

### Zone

Represents one grow area.

Possible fields:

- id
- name
- plantProfileId
- createdAt
- updatedAt

### Device

Represents one ESP32 or simulated device.

Possible fields:

- id
- zoneId
- name
- type
- firmwareVersion
- lastSeenAt
- createdAt
- updatedAt

### PlantProfile

Represents simple plant condition thresholds.

Possible fields:

- id
- name
- minTemperatureC
- maxTemperatureC
- minHumidityPct
- maxHumidityPct
- minLightLux
- maxLightLux
- createdAt
- updatedAt

### TelemetryReading

Represents one sensor reading event from a zone/device.

Possible fields:

- id
- zoneId
- deviceId
- recordedAt
- temperatureC
- humidityPct
- lightLux
- rawPayload
- createdAt

### ZoneState

Represents the latest evaluated state of a zone.

Possible fields:

- id
- zoneId
- status
- fanDesired
- lightDesired
- lastTelemetryAt
- lastEvaluatedAt
- updatedAt

### Command

Represents a command published to a device.

Possible fields:

- id
- zoneId
- deviceId
- source
- type
- payload
- status
- createdAt
- acknowledgedAt

Command source examples:

- manual
- automatic

Command status examples:

- pending
- published
- acknowledged
- failed

### DeviceHeartbeat

Represents device liveness events.

Possible fields:

- id
- deviceId
- seenAt
- status
- createdAt

---

## 13. MQTT topic contract

Topic prefix:

```txt
grow-node
```

Initial topics:

```txt
grow-node/zones/:zoneId/telemetry
grow-node/zones/:zoneId/heartbeat
grow-node/zones/:zoneId/commands
grow-node/zones/:zoneId/command-ack
```

Telemetry example:

```json
{
  "zoneId": "zone-1",
  "deviceId": "device-1",
  "temperatureC": 24.5,
  "humidityPct": 61,
  "lightLux": 380,
  "recordedAt": "2026-07-02T12:00:00.000Z"
}
```

Heartbeat example:

```json
{
  "zoneId": "zone-1",
  "deviceId": "device-1",
  "status": "online",
  "firmwareVersion": "0.1.0",
  "seenAt": "2026-07-02T12:00:00.000Z"
}
```

Command example:

```json
{
  "commandId": "cmd_123",
  "zoneId": "zone-1",
  "deviceId": "device-1",
  "type": "set-output",
  "payload": {
    "fan": true,
    "light": false
  },
  "createdAt": "2026-07-02T12:00:05.000Z"
}
```

Command acknowledgement example:

```json
{
  "commandId": "cmd_123",
  "zoneId": "zone-1",
  "deviceId": "device-1",
  "status": "acknowledged",
  "acknowledgedAt": "2026-07-02T12:00:06.000Z"
}
```

---

## 14. Initial API endpoints

The API service should expose only the endpoints needed by the dashboard.

Suggested first endpoints:

```txt
GET /health
GET /zones
GET /zones/:zoneId
GET /zones/:zoneId/telemetry
GET /zones/:zoneId/commands
POST /zones/:zoneId/commands
```

### `GET /zones`

Returns zone overview data.

Should include:

- zone id
- zone name
- latest telemetry summary
- latest evaluated state
- device heartbeat status

### `GET /zones/:zoneId/telemetry`

Returns recent telemetry readings for one zone.

Query params may include:

- limit

Keep filtering simple.

### `GET /zones/:zoneId/commands`

Returns recent command history for one zone.

### `POST /zones/:zoneId/commands`

Creates a manual fan/light command.

Allowed body:

```json
{
  "fan": true,
  "light": false
}
```

The API should:

- validate the request
- create a command row in PostgreSQL
- publish a command message to MQTT
- return the created command

---

## 15. Required features

## 15.1 Local infrastructure

- Docker Compose starts PostgreSQL
- Docker Compose starts Mosquitto
- Docker Compose starts the API service
- Docker Compose starts the control service
- Docker Compose starts the simulator service
- Docker Compose starts the dashboard
- Environment variables are documented with `.env.example`

---

## 15.2 Shared contracts

- MQTT topics are defined centrally
- MQTT payload schemas are defined with Zod
- API request schemas are defined with Zod
- Shared TypeScript types are inferred from Zod schemas
- Services do not duplicate payload types manually

---

## 15.3 Simulator

- Publishes telemetry for at least one zone
- Publishes heartbeat messages
- Uses the shared contracts package
- Can run inside Docker
- Logs published telemetry in development
- Can simulate at least one abnormal condition
- Can receive fan/light commands
- Can publish command acknowledgements

---

## 15.4 Control service

- Connects to MQTT
- Receives telemetry
- Validates telemetry payloads
- Stores telemetry in PostgreSQL
- Updates latest zone state
- Evaluates simple thresholds from plant profiles
- Publishes automatic commands when required
- Receives command acknowledgements
- Stores command acknowledgement status
- Tracks heartbeat status

---

## 15.5 API service

- Exposes dashboard-facing HTTP endpoints
- Validates params and request bodies with Zod
- Reads zone data from PostgreSQL
- Reads telemetry data from PostgreSQL
- Reads command history from PostgreSQL
- Creates manual commands
- Publishes manual commands to MQTT
- Returns clear error responses

---

## 15.6 Dashboard

- Shows all zones
- Shows latest telemetry per zone
- Shows latest evaluated zone state
- Shows whether device heartbeat is recent
- Shows recent telemetry history
- Shows recent command history
- Calls the API service over HTTP
- Does not access PostgreSQL directly
- Does not connect to MQTT directly
- Provides simple manual fan/light controls after read-only display works

---

## 15.7 Firmware

- Firmware folder exists in the repository
- Firmware README explains required hardware
- Firmware README explains how to build and upload
- Firmware follows the documented MQTT topic/payload contract
- Firmware is not required for the local demo

---

## 15.8 Documentation

- Root README explains the system in simple English
- `project-scope.md` defines the project boundaries
- `docs/architecture.md` explains the data flow
- `docs/local-development.md` explains how to run locally
- `docs/mqtt-topics.md` documents topics and payloads
- `docs/api.md` documents initial API endpoints
- `docs/hardware.md` lists hardware used
- `docs/wiring.md` explains wiring at a high level
- `docs/testing.md` explains the test approach
- `docs/ai-usage.md` explains how AI assistance was used

---

## 16. Testing scope

Testing is required, but it should stay small and practical.

The first version should include tests for the parts where testing gives the most value.

Required first test targets:

### Contracts package

Test that:

- valid telemetry payloads pass validation
- invalid telemetry payloads fail validation
- valid command payloads pass validation
- invalid command payloads fail validation

### Control service

Test that:

- normal telemetry creates normal zone status
- high temperature creates expected fan decision
- decision logic does not require MQTT or database to run

### API service

Test that:

- valid manual command request passes validation
- invalid manual command request fails validation
- command route rejects invalid params/body

Optional later tests:

- API route integration tests
- dashboard component tests
- simulator payload generation tests

Out of scope for the first version:

- Full end-to-end browser tests
- Playwright
- Testcontainers
- Real MQTT integration tests
- Real firmware tests
- Full dashboard test coverage
- Complex mocking setup

---

## 17. Explicitly out of scope

The first public version will not include:

- AWS
- AWS IoT Core
- Lambda
- DynamoDB
- Timestream
- Authentication
- User accounts
- Multi-tenant support
- Public cloud deployment
- Remote access
- Advanced alerting
- Email/SMS notifications
- Complex rule builder
- AI plant recommendations
- Historical analytics beyond simple recent readings
- Production-grade device provisioning
- OTA firmware updates (?)
- Message queues beyond MQTT
- Complex caching
- Full end-to-end test suite before the first working demo

These may be documented as future ideas, but they should not be built in the first refactor.

---

## 18. Design constraints

### General

- Keep the project understandable
- Prefer simple architecture over clever architecture
- Avoid adding services unless they have a clear responsibility
- Avoid premature production design
- Prioritize a working local demo
- Keep the project reviewer-friendly

### Code

- TypeScript is required for all Node.js and Next.js code
- Do not use `any`
- Prefer readable types over complex generic types
- Use Zod for external boundaries
- Validate MQTT payloads before using them
- Validate API requests before using them
- Keep MQTT payload types shared
- Keep API request/response contracts shared where useful
- Keep business logic out of the dashboard
- Keep database access out of the dashboard

### UI

- Dashboard should be clean, calm, and readable
- Desktop dashboard layout is the priority
- Mobile support is useful but secondary
- Avoid unnecessary animations
- Avoid over-designed visuals
- Prioritize clear system status

---

## 19. AI usage policy

AI assistance is allowed and should be documented honestly.

AI may be used for:

- Planning
- Architecture discussion
- Refactoring ideas
- Debugging support
- Code review prompts
- Documentation drafts
- Boilerplate generation
- Test ideas

AI should not be used as a replacement for understanding.

All AI-assisted code must be reviewed, edited, and tested by the developer before committing.

The public repository may include `docs/ai-usage.md` explaining that AI was used as a development assistant while the developer remained responsible for architecture, implementation decisions, testing, and final code quality.

---

## 20. Cursor / agent setup

Cursor project rules may be stored in:

```txt
.cursor/rules/grow-node.mdc
```

The rule file should remind the assistant/agent about:

- local-first scope
- no AWS
- no authentication
- no cloud deployment
- dashboard communicates with API only
- API owns dashboard-facing HTTP
- control service owns telemetry ingestion
- shared contracts live in `packages/contracts`
- database access setup lives in `packages/db`
- TypeScript is required
- `any` is not allowed
- Zod is used for external boundaries
- tests should stay small and practical

Optional tool-agnostic agent instructions may be stored in:

```txt
AGENTS.md
```

Cursor rules and agent instructions are development-support files. They should not replace normal project documentation.

---

## 21. Development workflow

Recommended commit style:

```txt
docs: define project scope
chore: add editor and prettier configuration
chore: add cursor project rules
chore: initialize pnpm workspace
chore: add monorepo folder structure
feat: add shared contracts package
feat: add initial prisma schema
chore: add postgres and mosquitto compose services
feat: add telemetry simulator service
feat: consume telemetry in control service
feat: persist telemetry readings
feat: update latest zone state
feat: add API service health route
feat: expose zone overview endpoint
feat: add dashboard shell
feat: display zone overview
feat: add manual fan and light commands
test: add contract validation tests
test: add zone decision tests
docs: add local development guide
```

Avoid unclear commits such as:

```txt
wip
fix
changes
update
oops
```

Each commit should represent one small completed step.

---

## 22. Suggested build order

Build the project in this order:

1. Define scope and repository rules
2. Add editor, Prettier, and workspace configuration
3. Create monorepo folder structure
4. Add shared contracts package
5. Add database package and initial Prisma schema
6. Add Docker Compose with PostgreSQL and Mosquitto
7. Add simulator service that publishes telemetry
8. Add control service that receives telemetry
9. Persist telemetry readings
10. Update latest zone state
11. Add API service with health route
12. Add API zone overview endpoint
13. Add dashboard shell
14. Display zone overview in dashboard
15. Add command history
16. Add simple manual fan/light commands
17. Add small tests for contracts and decision logic
18. Add documentation
19. Stop when the first clean local version works

---

## 23. Definition of Done

The first public version is done when:

- The repository is a clean monorepo
- Docker Compose starts the local system
- Mosquitto runs locally
- PostgreSQL runs locally
- The simulator publishes telemetry
- The simulator publishes heartbeat messages
- The control service consumes telemetry
- The control service validates incoming MQTT payloads
- Telemetry is stored in PostgreSQL
- Latest zone state is stored and updated
- The API service exposes dashboard-facing endpoints
- The dashboard reads data from the API service
- The dashboard displays zone overview
- The dashboard displays latest telemetry/state
- The dashboard displays command history
- Simple fan/light commands work in demo mode
- Command acknowledgements are visible in the system
- Shared contracts prevent duplicated MQTT/API payload types
- A small practical test suite exists
- Firmware folder is present and documented
- Root README explains the system clearly
- Local development docs are complete
- AI usage is documented honestly
- A reviewer can understand the architecture without extra explanation

---

## 24. Stop rule

When the first public version works locally and is documented, stop.

Do not add AWS, authentication, cloud deployment, advanced analytics, alerts, or extra features before the first clean public version is complete.

The goal is not to build the final production system.

The goal is to build a clear, runnable, impressive portfolio version of the system.
