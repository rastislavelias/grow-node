#include <Adafruit_SHT31.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>
#include <BH1750.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <math.h>
#include <time.h>

#include "config.h"

// ===== GLOBALS =====

WiFiClient espClient;
PubSubClient client(espClient);

Adafruit_SHT31 sht31 = Adafruit_SHT31();
BH1750 lightMeter;

bool fanOn = false;
bool lightOn = false;
bool heaterOn = false;

// ===== LOOP STATE =====

unsigned long lastTelemetryAt = 0;
unsigned long lastHeartbeatAt = 0;

const unsigned long telemetryIntervalMs = 5000;
const unsigned long heartbeatIntervalMs = 15000;

// ===== TOPICS =====

String getZoneBaseTopic() {
  return String("grow-node/zones/") + ZONE_ID;
}

String getTelemetryTopic() {
  return getZoneBaseTopic() + "/telemetry";
}

String getHeartbeatTopic() {
  return getZoneBaseTopic() + "/heartbeat";
}

String getCommandTopic() {
  return getZoneBaseTopic() + "/commands";
}

String getCommandAckTopic() {
  return getZoneBaseTopic() + "/command-ack";
}

// ===== HELPERS =====

float round1(float value) {
  return roundf(value * 10.0f) / 10.0f;
}

int roundInt(float value) {
  return (int)roundf(value);
}

String getIsoTimestamp() {
  time_t now = time(nullptr);

  if (now < 100000) {
    return "";
  }

  struct tm timeInfo;
  gmtime_r(&now, &timeInfo);

  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);

  return String(buffer);
}

void writeRelay(int pin, bool activeHigh, bool on) {
  if (activeHigh) {
    digitalWrite(pin, on ? HIGH : LOW);
  } else {
    digitalWrite(pin, on ? LOW : HIGH);
  }
}

// ===== OUTPUTS =====

void setFan(bool on) {
  const bool changed = fanOn != on;

  fanOn = on;
  writeRelay(FAN_PIN, FAN_RELAY_ACTIVE_HIGH, fanOn);

  if (changed) {
    Serial.println(fanOn ? "FAN ON" : "FAN OFF");
  } else {
    Serial.println(fanOn ? "FAN already ON" : "FAN already OFF");
  }
}

void setLight(bool on) {
  const bool changed = lightOn != on;

  lightOn = on;
  writeRelay(LIGHT_PIN, LIGHT_RELAY_ACTIVE_HIGH, lightOn);

  if (changed) {
    Serial.println(lightOn ? "LIGHT ON" : "LIGHT OFF");
  } else {
    Serial.println(lightOn ? "LIGHT already ON" : "LIGHT already OFF");
  }
}

void setHeater(bool on) {
  const bool changed = heaterOn != on;

  heaterOn = on;
  writeRelay(HEATER_PIN, HEATER_RELAY_ACTIVE_HIGH, heaterOn);

  if (changed) {
    Serial.println(heaterOn ? "HEATER ON" : "HEATER OFF");
  } else {
    Serial.println(heaterOn ? "HEATER already ON" : "HEATER already OFF");
  }
}

// ===== WIFI =====

void setupWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ===== TIME =====

void setupTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Syncing time");

  time_t now = time(nullptr);

  while (now < 100000) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }

  Serial.println("\nTime synced");
}

// ===== OTA =====

void setupOTA() {
  ArduinoOTA.setHostname(ZONE_ID);
  ArduinoOTA.setPort(3232);
  ArduinoOTA.begin();

  Serial.println("OTA ready");
}

// ===== HEARTBEAT =====

String createHeartbeatPayload(const char* status) {
  JsonDocument doc;

  doc["zoneId"] = ZONE_ID;
  doc["status"] = status;
  doc["firmwareVersion"] = FIRMWARE_VERSION;

  const String seenAt = getIsoTimestamp();

  if (seenAt.length() == 0) {
    doc["seenAt"] = "1970-01-01T00:00:00Z";
  } else {
    doc["seenAt"] = seenAt;
  }

  String payload;
  serializeJson(doc, payload);

  return payload;
}

void publishHeartbeat() {
  if (!client.connected()) {
    return;
  }

  const String payload = createHeartbeatPayload("online");

  client.publish(getHeartbeatTopic().c_str(), payload.c_str(), false);

  Serial.print("Heartbeat published: ");
  Serial.println(payload);
}

// ===== TELEMETRY =====

void publishTelemetry() {
  if (!client.connected()) {
    return;
  }

  const float rawTemp = sht31.readTemperature();
  const float rawHum = sht31.readHumidity();
  const float rawLux = lightMeter.readLightLevel();

  if (isnan(rawTemp) || isnan(rawHum) || isnan(rawLux)) {
    Serial.println("Skipping telemetry because one or more sensors failed");
    return;
  }

  const String recordedAt = getIsoTimestamp();

  if (recordedAt.length() == 0) {
    Serial.println("Skipping telemetry because time is not synced");
    return;
  }

  JsonDocument doc;

  doc["zoneId"] = ZONE_ID;
  doc["temperatureC"] = round1(rawTemp);
  doc["humidityPct"] = round1(rawHum);
  doc["lightLux"] = roundInt(rawLux);
  doc["recordedAt"] = recordedAt;

  char buffer[512];
  const size_t size = serializeJson(doc, buffer, sizeof(buffer));

  if (size == 0 || size >= sizeof(buffer)) {
    Serial.println("Telemetry payload too large");
    return;
  }

  client.publish(getTelemetryTopic().c_str(), buffer, false);

  Serial.print("Telemetry published: ");
  Serial.println(buffer);

  Serial.print("Temp: ");
  Serial.print(round1(rawTemp));

  Serial.print(" | Hum: ");
  Serial.print(round1(rawHum));

  Serial.print(" | Lux: ");
  Serial.print(roundInt(rawLux));

  Serial.print(" | Fan: ");
  Serial.print(fanOn ? "ON" : "OFF");

  Serial.print(" | Light: ");
  Serial.print(lightOn ? "ON" : "OFF");

  Serial.print(" | Heater: ");
  Serial.println(heaterOn ? "ON" : "OFF");
}

// ===== COMMAND ACK =====

void publishCommandAck(const char* commandId, const char* status, const char* message = nullptr) {
  if (!client.connected()) {
    return;
  }

  const String acknowledgedAt = getIsoTimestamp();

  if (acknowledgedAt.length() == 0) {
    Serial.println("Skipping command ACK because time is not synced");
    return;
  }

  JsonDocument doc;

  doc["commandId"] = commandId;
  doc["zoneId"] = ZONE_ID;
  doc["status"] = status;
  doc["acknowledgedAt"] = acknowledgedAt;

  if (message != nullptr && strlen(message) > 0) {
    doc["message"] = message;
  }

  char buffer[512];
  const size_t size = serializeJson(doc, buffer, sizeof(buffer));

  if (size == 0 || size >= sizeof(buffer)) {
    Serial.println("Command ACK payload too large");
    return;
  }

  client.publish(getCommandAckTopic().c_str(), buffer, false);

  Serial.print("Command ACK published: ");
  Serial.println(buffer);
}

// ===== MQTT COMMANDS =====

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  constexpr size_t maxPayloadSize = 768;

  if (length >= maxPayloadSize) {
    Serial.println("Command payload too large");
    return;
  }

  const String topicString = String(topic);
  const String expectedTopic = getCommandTopic();

  if (topicString != expectedTopic) {
    Serial.print("Ignoring unknown topic: ");
    Serial.println(topicString);
    return;
  }

  char message[maxPayloadSize];
  memcpy(message, payload, length);
  message[length] = '\0';

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("Invalid command JSON: ");
    Serial.println(error.c_str());
    return;
  }

  const char* commandId = doc["commandId"] | "";
  const char* commandZoneId = doc["zoneId"] | "";
  const char* commandType = doc["type"] | "";

  if (strlen(commandId) == 0) {
    Serial.println("Command missing commandId");
    return;
  }

  if (strcmp(commandZoneId, ZONE_ID) != 0) {
    Serial.println("Ignoring command for different zone");
    publishCommandAck(commandId, "failed", "Command zoneId does not match controller zoneId");
    return;
  }

  if (strcmp(commandType, "set-output") != 0) {
    Serial.println("Ignoring unsupported command type");
    publishCommandAck(commandId, "failed", "Unsupported command type");
    return;
  }

  JsonVariantConst fanValue = doc["payload"]["fan"];
  JsonVariantConst lightValue = doc["payload"]["light"];
  JsonVariantConst heaterValue = doc["payload"]["heater"];

  if (!fanValue.is<bool>() || !lightValue.is<bool>() || !heaterValue.is<bool>()) {
    Serial.println("Invalid output command payload");
    publishCommandAck(commandId, "failed", "Invalid set-output payload");
    return;
  }

  Serial.print("Command received on ");
  Serial.println(topicString);

  setFan(fanValue.as<bool>());
  setLight(lightValue.as<bool>());
  setHeater(heaterValue.as<bool>());

  publishCommandAck(commandId, "acknowledged");
  publishTelemetry();
  publishHeartbeat();
}

// ===== MQTT =====

void reconnectMqtt() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");

    if (client.connect(ZONE_ID)) {
      Serial.println("connected");

      const String commandTopic = getCommandTopic();
      client.subscribe(commandTopic.c_str(), 1);

      Serial.print("Subscribed to: ");
      Serial.println(commandTopic);

      publishHeartbeat();
      publishTelemetry();
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

// ===== SETUP =====

void setup() {
  Serial.begin(115200);

  Wire.begin(SDA_PIN, SCL_PIN);

  pinMode(FAN_PIN, OUTPUT);
  fanOn = false;
  writeRelay(FAN_PIN, FAN_RELAY_ACTIVE_HIGH, fanOn);

  pinMode(LIGHT_PIN, OUTPUT);
  lightOn = false;
  writeRelay(LIGHT_PIN, LIGHT_RELAY_ACTIVE_HIGH, lightOn);

  pinMode(HEATER_PIN, OUTPUT);
  heaterOn = false;
  writeRelay(HEATER_PIN, HEATER_RELAY_ACTIVE_HIGH, heaterOn);

  setupWifi();
  setupTime();
  setupOTA();

  if (!sht31.begin(0x44)) {
    Serial.println("Couldn't find SHT30/SHT31 at address 0x44");
    while (true) {
      delay(1000);
    }
  }

  if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("Couldn't find BH1750");
    while (true) {
      delay(1000);
    }
  }

  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(onMqttMessage);
  client.setBufferSize(1024);

  Serial.println("Grow Node zone controller ready");
}

// ===== LOOP =====

void loop() {
  yield();
  ArduinoOTA.handle();

  if (!client.connected()) {
    reconnectMqtt();
  }

  client.loop();

  const unsigned long now = millis();

  if (now - lastTelemetryAt >= telemetryIntervalMs) {
    lastTelemetryAt = now;
    publishTelemetry();
  }

  if (now - lastHeartbeatAt >= heartbeatIntervalMs) {
    lastHeartbeatAt = now;
    publishHeartbeat();
  }
}