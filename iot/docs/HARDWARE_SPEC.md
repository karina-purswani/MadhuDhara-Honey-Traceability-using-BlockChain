# Honey Chain IoT Node Hardware Specification

This document details the target hardware architecture for Honey Chain field deployments across KVIC Honey Mission clusters.

## 1. System Overview

Rural apiaries frequently lack direct AC power and stable cellular reception. The Honey Chain node is designed for:
- Low-power operation (sleep currents < 15 µA)
- 6–12 months battery endurance backed by a small solar harvester
- Non-invasive placement inside Langstroth and Indian ISI bee boxes
- Dual connectivity (LoRaWAN / 4G NB-IoT / Bluetooth Low Energy for local field app synchronization)

---

## 2. Core Bill of Materials (BOM)

| Component | Part / Spec | Function | Placement |
|---|---|---|---|
| **MCU** | ESP32-WROOM-32E (or Nordic nRF52840) | 240 MHz dual-core, BLE 5.0, Wi-Fi / ESP-NOW | Mounted on underside of hive roof |
| **Telemetry Sensor** | Sensirion SHT31-D or DHT22 | Precision temperature (±0.2°C) & relative humidity (±2% RH) | Centered between brood frames 4 & 5 |
| **Weight Transducer** | 4x 50kg Half-Bridge Strain Gauges (Wheatstone Bridge) | 0–150 kg total range, ±20g precision | Hive base scale platform |
| **ADC Amplifier** | Avia Semiconductor HX711 | 24-bit analog-to-digital converter for strain gauges | Weatherproof junction enclosure |
| **Acoustic / Vibration** | Knowles SPH0645LM4H (I2S MEMS) or SW-420 | Frequency monitoring (400–600 Hz queen/swarming analysis) | Interior brood wall |
| **Power Management** | TP4056 + MPPT solar charge controller | 3.7V 3500mAh 18650 LiFePO4 battery + 5V 2W Monocrystalline panel | Exterior south-facing bracket |
| **Enclosure** | IP66 UV-stabilized polycarbonate | Weatherproofing against rain, bees-wax propolis, and field heat | External rear wall |

---

## 3. Communication Protocol

### Normal Mode:
1. Node wakes every 15 minutes.
2. Takes 5 consecutive temperature and humidity samples, discards outliers.
3. Tares and averages HX711 scale readings.
4. Encodes payload into 18-byte packed binary or JSON format.
5. Transmits to Honey Chain API gateway via HTTP/MQTT or LoRaWAN gateway.
6. Returns to ultra-deep sleep.

### Alert Mode:
- If temperature exceeds 37.5°C or drops below 31.0°C, or weight decreases > 1.5 kg in < 30 minutes (potential swarming or robbery), immediate interrupt triggers an emergency packet.

---

## 4. Calibration & Anti-Propolis Measures
Honey bees coat foreign objects inside the hive with propolis (bee resin).
- Sensors are encased in fine stainless steel 100-mesh wire jackets that permit gas diffusion and thermal equilibrium while preventing bees from gluing the sensor element.
- Calibration offsets are stored in ESP32 non-volatile storage (NVS).
