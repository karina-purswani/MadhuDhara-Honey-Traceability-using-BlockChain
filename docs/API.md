# Honey Chain REST API Specification

## 1. Honey Batches & Traceability

### GET `/api/batches/:batchNumber`
- **Access**: Public
- **Description**: Retrieves public provenance information for an existing bottle batch number.
- **Response**:
```json
{
  "batchNumber": "HC-MH-NAS-2026-00047",
  "productName": "Pure Raw Multi-Floral Sahyadri Honey",
  "beekeeperName": "Ramesh Patil",
  "originDistrict": "Nashik",
  "harvestDate": "2026-09-12",
  "verificationStatus": "VERIFIED",
  "moisturePercentage": 17.4,
  "blockchainTxHash": "0x8f2a149b8173491bc309e4f20819a3b7d159048381940176cdb2c91201",
  "events": [
    {
      "eventType": "HARVESTED",
      "timestamp": "2026-09-12T07:30:00Z",
      "actor": "Ramesh Patil",
      "description": "Harvested 8.7 kg of 100% capped multi-floral comb"
    }
  ]
}
```

### POST `/api/batches`
- **Access**: Authorized Beekeeper / KVIC Admin
- **Description**: Registers and mints a new honey batch onto the ledger.

---

## 2. IoT Telemetry & Health

### POST `/api/iot/telemetry`
- **Access**: Device Gateway (ESP32 Token)
- **Payload**:
```json
{
  "hive_id": "HC-HIVE-MH-NAS-00123",
  "timestamp": "2026-09-26T11:45:00Z",
  "temperature_c": 34.6,
  "humidity_pct": 57.2,
  "weight_kg": 46.8,
  "acoustic_hz": 450,
  "battery_pct": 94
}
```

### GET `/api/hives/:hiveId/health`
- **Description**: Returns multi-parameter health calculation breakdown.

---

## 3. Support Tickets

### POST `/api/tickets`
- **Description**: Creates a new technical consultation ticket with prefilled IoT anomaly context.

### POST `/api/tickets/:ticketId/reply`
- **Description**: KVIC officer responds to a beekeeper ticket.
