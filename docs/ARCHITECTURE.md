# Honey Chain System Architecture

## 1. Domain Conceptual Flow

The core architecture connects physical rural apiaries to the digital blockchain ledger:

```text
BEEKEEPER (KVIC Registered)
    │
    ▼
APIARY (Geo-tagged location)
    │
    ▼
HIVE DIGITAL ID (HC-HIVE-MH-NAS-00123)
    │
    ▼
IoT SENSOR STREAM (ESP32: Temp, Humidity, Weight, Acoustics)
    │
    ▼
AI HEALTH ANALYSIS & SMART ALERTS (Thermal, Swarming, Pest screening)
    │
    ▼
HARVEST RECORD (Moisture %, Capped comb ratio, Date)
    │
    ▼
HONEY BATCH (HC-MH-NAS-2026-00047)
    │
    ▼
BLOCKCHAIN AUDIT TRAIL (7 immutable lifecycle events with Tx hashes)
    │
    ▼
EXISTING PRINTED BATCH NUMBER + PERSISTENT QR
    │
    ▼
PUBLIC VERIFICATION PORTAL & CONSUMER TRACEABILITY
```

---

## 2. On-Chain vs. Off-Chain Storage Strategy

To ensure gas efficiency and scalability, Honey Chain adheres to strict storage decoupling:

### Off-Chain (Firestore / In-Memory Mock Repository):
- High-frequency IoT telemetry time series
- Full-resolution comb inspection photography
- Private beekeeper contact details and bank subsidy records
- Support ticket internal correspondence and attachments
- Full video library and learning guides

### On-Chain (EVM Smart Contract):
- Batch Number and Genesis Minting Hash
- Linked Hive Digital ID and Beekeeper ID
- Lifecycle milestone timestamps and cryptographic actor signatures
- Lab analysis summary parameters (Moisture %, Sucrose %, C4 sugar test status)
- Merkle root hash of quality documentation
