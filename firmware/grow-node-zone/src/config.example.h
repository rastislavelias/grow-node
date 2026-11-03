#pragma once

// WiFi
static const char* WIFI_SSID = "YOUR_WIFI";
static const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// MQTT
static const char* MQTT_SERVER = "YOUR_MQTT_IP";
static const int MQTT_PORT = 1883;

// Zone/controller
static const char* ZONE_ID = "zone-2";
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