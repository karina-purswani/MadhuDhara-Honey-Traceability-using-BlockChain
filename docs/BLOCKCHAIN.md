# Honey Chain Blockchain Architecture

## 1. Overview
Honey Chain utilizes an EVM-compatible smart contract (`blockchain/contracts/HoneyTraceability.sol`) to maintain an immutable audit trail for honey batches from harvest to consumer.

## 2. Core Smart Contract Functions
- `registerBatch`: Mints a new honey batch token with genesis metadata.
- `addBatchEvent`: Appends milestone events (Extraction, NABL Lab Analysis, Packaging, Dispatch).
- `verifyBatch`: Public view method verifying cryptographic integrity and event history.
- `getBatchEvents`: Returns chronological event logs for timeline visualization.

## 3. Demo Mode Simulation
In prototype mode (`DEMO_MODE=true`), `MockBlockchainService` (`blockchain/services/blockchain.service.ts`) deterministically computes transaction hashes, simulates gas receipts, and verifies integrity without requiring gas fees or testnet faucet tokens.
