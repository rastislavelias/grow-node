# Grow Node — MVP Scope

## Purpose

Grow Node is a portfolio-quality, local-first IoT monitoring demo. It shows how environmental telemetry can travel from a simulated or physical controller through MQTT and backend services into PostgreSQL and a web dashboard.

The MVP is not a production grow-management platform. Its purpose is to present one complete, understandable, and reproducible technical workflow.

## MVP outcome

A reviewer can clone the repository, run one command, open the dashboard, and see live simulated data without owning an ESP32 or configuring external services.

```bash
docker compose up --build
```

Expected result:

1. Docker starts PostgreSQL, Mosquitto, database setup, the simulator, control service, API, and dashboard.
2. The simulator publishes telemetry and heartbeat messages for one demo zone.
3. The control service validates and stores the messages, then evaluates the zone state.
4. The API exposes the latest state and recent telemetry.
5. The dashboard displays a healthy, continuously updating demo at `http://localhost:3000`.

## Primary demo flow

```text
Simulator
  → MQTT / Mosquitto
  → Control service
  → PostgreSQL
  → API service
  → Next.js dashboard
```

The optional ESP32 firmware follows the same MQTT contract but is not required for the local demo.

## In scope

### Local infrastructure

- Docker Compose starts the complete demo.
- PostgreSQL health is checked before migrations and seed data run.
- Prisma migrations and idempotent seed data run automatically.
- Mosquitto provides local MQTT messaging.
- No cloud account or physical hardware is required.

### Simulated controller

- Simulate one grow zone.
- Publish temperature, humidity, and light telemetry at a regular interval.
- Publish controller heartbeat messages.
- Receive output commands and acknowledge them when command flow is demonstrated.

### Control service

- Subscribe to shared MQTT topics.
- Validate external messages with Zod contracts.
- Persist telemetry and controller state.
- Evaluate a small set of plant-profile thresholds.
- Store the latest desired fan and light state.
- Keep decision logic independent from the dashboard.

### API service

- Expose health and zone endpoints required by the dashboard.
- Read current state, recent telemetry, and recent commands from PostgreSQL.
- Expose zone create, update, and delete endpoints.
- Expose plant-profile list, detail, create, update, and delete endpoints.
- Allow a plant profile to be assigned to a zone.
- Reject deletion with `409 Conflict` when one or more zones use the profile, returning the affected zone IDs and names.
- Validate parameters and request bodies.
- Keep database and MQTT access behind the API/control boundary.

### Dashboard

The public dashboard should be intentionally small and readable.

Required overview:

- one simulated zone;
- overall demo health;
- controller online/offline status;
- latest reading time;
- temperature;
- humidity;
- light level;
- fan and light desired state;
- a short recent-telemetry table.

Required UI states:

- loading;
- no data;
- API error;
- stale/offline controller;
- normal and attention states.

The primary demo must show a healthy state when the simulator and all services are running.

### Plant-profile management

- Preserve the complete existing profile model for both `lightOn` and `lightOff` phases.
- Preserve temperature, humidity, illuminance, estimated PPFD, VPD, condensation margin, ranges, scales, and settling times.
- List all plant profiles and show which zones use each profile.
- Create and edit complete profiles through validated forms.
- Assign one profile to multiple zones.
- Allow deletion only when no zone uses the profile.
- When deletion is blocked, show an alert listing and linking to every zone that uses the profile.
- Keep profile management local-only and unauthenticated for the portfolio MVP; do not present it as a production-secure admin system.

### Zone management

- List, create, edit, and delete zones through the local dashboard.
- Require a unique zone ID, display name, controller type, and plant profile when creating a zone.
- Treat the zone ID as the controller's MQTT identity and keep it immutable after creation.
- Allow the zone name, controller type, firmware version, and assigned plant profile to be edited.
- Create an initial zone-state record together with every zone.
- Require explicit confirmation before deleting a zone because its telemetry, heartbeats, command history, and current state are deleted with it.
- Present zone creation as local controller registration, not remote device provisioning.
- Keep physical-device provisioning, credentials, certificates, and automatic simulator-instance management out of scope.

### Shared packages

- `packages/contracts` owns MQTT and API schemas shared across services.
- `packages/db` owns the Prisma schema, client, migrations, and seed data.
- Node.js and Next.js code remains TypeScript-first.
- External boundaries are validated with Zod.

### Firmware

- Keep the ESP32/PlatformIO firmware in the repository as an optional hardware implementation.
- Document the required hardware, configuration, build, and upload steps.
- Use the same telemetry, heartbeat, command, and acknowledgement contract as the simulator.
- Do not require firmware or hardware to review the web demo.

### Testing

The MVP requires a small, high-value test suite:

- valid and invalid MQTT contract payloads;
- valid and invalid command payloads;
- plant-profile phase configuration;
- control decision logic for normal and abnormal readings.

Before release, these commands must pass:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
```

## Dashboard presentation

The dashboard should keep the complete existing plant evaluation model while making it easier to read.

- The overview should prioritise status, controller freshness, temperature, humidity, and light.
- The zone detail may show VPD, estimated PPFD, condensation margin, metric ranges, settling state, and output decisions.
- Plant-profile editing must expose the complete configuration rather than silently hiding or discarding advanced values.
- Simplification means clearer grouping and labels, not removing domain data from the model.

## Explicitly out of scope

- authentication and user accounts;
- multi-tenant support;
- AWS or another cloud deployment;
- remote device provisioning;
- production MQTT security and certificate management;
- alerts, email, SMS, or push notifications;
- advanced analytics and long-term reporting;
- AI plant recommendations;
- automatic watering or nutrient dosing;
- visual rule builders;
- OTA firmware updates;
- mobile applications;
- a full design system;
- exhaustive browser or hardware testing;
- production readiness claims.

## Repository structure

```text
apps/dashboard              Next.js dashboard
services/api                Dashboard-facing HTTP API
services/control            MQTT ingestion and decision logic
services/simulator          Simulated controller and telemetry
packages/contracts          Shared Zod contracts and types
packages/db                 Prisma, PostgreSQL, migrations, seed
firmware/grow-node-zone     Optional ESP32 firmware
infra/mosquitto             Local MQTT configuration
docs                        Project scope and supporting documentation
```

## Release checklist

- [x] Monorepo structure is established.
- [x] Docker Compose starts all application services.
- [x] Database migrations and seed data run automatically.
- [x] Simulator publishes telemetry and heartbeat messages.
- [x] Control service validates and stores telemetry.
- [x] API exposes system health and zone data.
- [x] Dashboard reads through the API rather than PostgreSQL or MQTT.
- [x] Shared contracts and focused unit tests exist.
- [x] Optional ESP32 firmware is included.
- [x] Plant-profile CRUD API is implemented and validated.
- [x] Profiles can be assigned to zones.
- [x] Deleting an unused profile succeeds.
- [x] Deleting an in-use profile returns a conflict with the affected zones.
- [x] Dashboard profile management supports complete profile creation and editing.
- [x] A blocked-delete alert links to every affected zone.
- [x] Default seed/demo presents one active simulated zone without a misleading degraded state.
- [x] Zone create, edit, and delete API endpoints are implemented and validated.
- [x] Dashboard supports zone creation, editing, and confirmed deletion.
- [x] Dashboard presents core and advanced metrics with a clear hierarchy.
- [x] Temporary debug UI and unused components are removed.
- [ ] Root README matches the final behaviour and includes a current screenshot.
- [ ] A clean clone passes the one-command startup test.
- [x] Formatting, linting, type checking, and tests pass.
- [ ] Repository history and tracked files contain no secrets.
- [ ] Repository is ready to be made public.

## Definition of done

Grow Node MVP is complete when a reviewer unfamiliar with the codebase can:

1. understand the project from the root README;
2. start it with `docker compose up --build`;
3. open the dashboard and see fresh simulated telemetry;
4. understand the main data flow without additional explanation;
5. inspect a small, coherent codebase with passing quality checks;
6. see optional firmware as evidence of hardware integration, not as a requirement.

## Stop rule

Once the definition of done is satisfied, stop adding features.

Publish the repository, use it as a portfolio project, and move new experimentation into a separate project. Any future Grow Node work should fix a demonstrated problem rather than expand the product scope.
