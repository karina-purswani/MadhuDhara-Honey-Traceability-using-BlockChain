# Antigravity Future Integration Blueprint

This document guides the Antigravity engineering team in swapping mock services for live production infrastructure without refactoring frontend components or domain interfaces.

## 1. Firebase Firestore Migration
- **Target File**: `backend/src/repositories/firestore.repo.placeholder.ts`
- **Steps**:
  1. Set `DEMO_MODE=false` in `.env`.
  2. Implement `FirestoreBatchRepository`, `FirestoreHiveRepository`, and `FirestoreTicketRepository` using `@google-cloud/firestore`.
  3. Replace calls in backend controllers from `mockDb` to Firestore repositories.

## 2. Real EVM Blockchain Deployment
- **Contract Source**: `blockchain/contracts/HoneyTraceability.sol`
- **Target File**: `blockchain/services/blockchain.service.ts`
- **Steps**:
  1. Deploy `HoneyTraceability.sol` to Polygon or Avalanche testnet using Hardhat or Foundry.
  2. Provide `BLOCKCHAIN_RPC_URL`, `CONTRACT_ADDRESS`, and `RELAYER_PRIVATE_KEY` in `.env`.
  3. In `blockchain.service.ts`, switch `blockchainService` export from `MockBlockchainService` to `RealBlockchainService`.

## 3. IoT Hardware Ingestion (MQTT / LoRaWAN)
- **Target File**: `iot/services/iot.service.ts`
- **Steps**:
  1. Configure MQTT broker (e.g. Mosquitto / EMQX) matching `MQTT_BROKER_URL`.
  2. Flash ESP32 units with payload structure defined in `iot/schemas/telemetry.json`.
  3. Implement `RealIoTService` to ingest time-series records into TimescaleDB or Firestore.

## 4. Python AI Inference Microservice
- **Target Code**: `ai-service/app/main.py`
- **Steps**:
  1. Run FastAPI service on port 8000.
  2. Load trained PyTorch/ONNX models for comb image classification and LSTM yield forecasting.
  3. Set `AI_SERVICE_URL=http://localhost:8000` in `.env`.
