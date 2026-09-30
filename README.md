# Honey Chain: Blockchain Honey Traceability & Smart Beekeeping Management

**Problem Statement ID:** 26021  
**Target Program:** Khadi and Village Industries Commission (KVIC) National Honey Mission

---

## 🍯 Executive Summary

**Honey Chain** is an integrated digital ecosystem designed for rural beekeepers, KVIC administrators, quality testing laboratories, and end consumers. It addresses the critical challenges in the Indian apiculture sector:
- Counterfeit & adulterated honey (C4 sugar syrup adulteration)
- Weak physical-to-digital traceability
- Lack of real-time hive health monitoring in remote apiaries
- Suboptimal seasonal yields due to unmonitored swarming and pests
- Limited market linkage and low realization for tribal and smallholder beekeepers

### The Core Concept
> Honey Chain assigns every bee box and honey batch a **unique digital identity**, continuously monitors colony micro-climates through **IoT sensor telemetry**, applies **AI-assisted diagnostic and yield decision support**, establishes an **immutable blockchain provenance trail**, and empowers consumers to verify existing bottle **Batch Numbers** via a **persistent QR-based traceability ledger** without packaging redesign.

---

## 🌟 Unique Selling Propositions (USPs)

1. **Multilingual Rural Accessibility**: Full tri-lingual interface supporting **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**.
2. **Role-Specific Experiences**:
   - **Beekeeper**: Colony management, live IoT gauges, AI risk scanner, yield predictor, 1-click support ticketing, profit calculator, marketplace.
   - **KVIC Admin**: Regional cluster analytics (Nashik, Pune), biosecurity monitoring, video guide broadcasting, ticket advisory desk.
   - **Public Consumer**: Zero-login, instant batch verification via physical bottle Batch Number (`HC-MH-NAS-2026-00047`).
3. **Hive Passport**: Unique permanent digital identity (`HC-HIVE-MH-NAS-00123`) encapsulating lifespan biological inspections, IoT telemetry, queen age, and harvest history.
4. **IoT Biological Anomaly Alerts**: Real-time alerts for brood thermal spikes (>37°C), sudden swarming mass drops (>1.5kg loss), and humidity saturation.
5. **Alert → 1-Click Support Ticket**: Automatically pre-fills current sensor readings, health score, and hive telemetry for KVIC advisory review.
6. **AI Decision Support**:
   - Brood comb computer vision screening for Varroa mites & Nosema risk indicators.
   - Multi-factor honey yield prediction forecasting optimal extraction dates.
7. **Blockchain Provenance Trail**: 7-stage lifecycle ledger: *Hive Registered → Colony Production → Harvest → Extraction → Quality Lab → Packaging → Distribution*.
8. **Anti-Counterfeit Flagging**: Detects suspicious scan velocity and anomalies across geographical lookups.
9. **KVIC Honey Mission Learning Hub**: Admin-pushed training video guides with instant notifications to beekeeper devices.
10. **Beekeeper ↔ Consumer Marketplace**: Transparent marketplace listings cryptographically linked to verified batches.
11. **Apiculture Profit Calculator**: Interactive micro-economics simulator calculating seasonal margin, cost per kg, and net income per box.

---

## 🏛️ System Architecture

```text
├── frontend/ (src/)
│   ├── components/       # Distinctive, accessible Tailwind & Lucide UI views
│   ├── context/          # Auth, Language (i18n), and App live state
│   ├── services/         # Persistent QR generation & caching
│   └── i18n/             # English, Hindi, and Marathi dictionaries
├── backend/
│   ├── repositories/     # In-memory mock database & Firestore adapter placeholder
│   └── services/         # API controllers and data handlers
├── blockchain/
│   ├── contracts/        # HoneyTraceability.sol (EVM Smart Contract)
│   └── services/         # MockBlockchainService & RealBlockchainService
├── ai-service/
│   ├── app/              # Python FastAPI reference microservice
│   └── services/         # Multi-factor health scoring & yield algorithms
├── iot/
│   ├── simulator/        # HiveSimulator with biological anomaly presets
│   ├── schemas/          # JSON Schema for ESP32 telemetry payloads
│   └── docs/             # Hardware specification (ESP32, SHT31, HX711)
├── shared/
│   └── types.ts          # Central domain models & TypeScript contracts
└── docs/                 # Detailed architectural & integration manuals
```

---

## 🚀 Getting Started (Localhost Demo Mode)

The application runs in **Local Demo Mode (`DEMO_MODE=true`)** out-of-the-box. **No external credentials, API keys, or cloud infrastructure are required.**

### 1. Installation
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 User Roles & Authentication

The application features true multi-user role separation and persistent authentication:
- **Beekeeper** (Authenticated):
  - Register new apiary accounts or sign in (`beekeeper@example.com` / `password123`)
  - Full access to own hives, IoT telemetry, alerts, AI diagnostic tools, batches, tickets, and profit calculations.
- **KVIC Admin** (Authenticated):
  - Secure sign in (`admin@example.com` / `admin123`)
  - Full access to cluster analytics, regional beekeepers, all hives, support ticket advisory desk, and learning management.
- **Public Consumer** (Zero-Login / Public):
  - Consumers do not register or log in.
  - Direct public verification via physical bottle Batch Number (`HC-MH-NAS-2026-00047`).

---

## 🔍 Public Verification Flow

1. Access the verification screen via **Public Verify** in the navigation.
2. Enter the Batch Number printed on the physical bottle:
   - **Valid Batch**: `HC-MH-NAS-2026-00047`
   - **Suspicious Batch**: `HC-MH-NAS-2026-SUSP`
   - **Counterfeit Batch**: `HC-FAKE-9999`
3. Click **Verify Batch**.
4. The system presents the existing persistent QR code.
5. Click **View Traceability Journey** to inspect the 7-step blockchain audit trail.
