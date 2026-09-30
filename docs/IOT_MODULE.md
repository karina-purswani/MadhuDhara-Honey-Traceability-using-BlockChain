# Honey Chain IoT Hive Monitoring Module

## 1. Physical Sensing Unit
- **Microcontroller**: ESP32-WROOM-32E with solar-backed 18650 LiFePO4 battery
- **Temperature & Humidity**: Sensirion SHT31-D or DHT22 in stainless steel anti-propolis mesh
- **Weight Platform**: 4x half-bridge strain gauges + HX711 24-bit ADC
- **Acoustic Sensor**: Knowles MEMS microphone for frequency analysis (400–650 Hz)

## 2. Telemetry Simulator (`iot/simulator/hive_simulator.ts`)
The prototype includes an active simulation engine supporting 5 biological conditions:
- `OPTIMAL_FLOW`: Stable 34.6°C, 57% humidity, steady nectar weight gain
- `HEAT_STRESS`: Thermal surge to 38.6°C with worker fanning activity
- `SWARMING_WEIGHT_DROP`: Sudden 2.4 kg drop with agitated acoustic frequencies
- `HUMIDITY_ALERT`: Elevated 78% moisture requiring ventilation
- `NIGHT_COOLING`: Sub-brood ambient temperature adjustment
