# Honey Chain Firestore & Database Schema

The database model is organized around 12 core collections:

1. `users`
   - `id`: string (UID)
   - `name`: string
   - `email`: string
   - `role`: 'beekeeper' | 'admin'
   - `preferredLanguage`: 'en' | 'hi' | 'mr'

2. `beekeepers`
   - `beekeeperId`: string (e.g. `BK-MH-NAS-0129`)
   - `kvicRegistrationNumber`: string
   - `totalApiaries`: number
   - `totalHives`: number

3. `apiaries`
   - `id`: string
   - `beekeeperId`: string
   - `name`: string
   - `coordinates`: { lat, lng }
   - `floraType`: string[]

4. `hives`
   - `id`: string (`HC-HIVE-MH-NAS-00123`)
   - `boxNumber`: string
   - `beeSpecies`: string
   - `currentHealthScore`: number (0-100)
   - `hasIoTUnit`: boolean
   - `iotDeviceId`: string

5. `hive_readings` (Time Series)
   - `id`: string
   - `hiveId`: string
   - `timestamp`: string
   - `temperature`: number
   - `humidity`: number
   - `weight`: number
   - `acousticFrequencyHz`: number

6. `honey_batches`
   - `id`: string (`HC-MH-NAS-2026-00047`)
   - `productName`: string
   - `beekeeperId`: string
   - `hiveIds`: string[]
   - `harvestDate`: string
   - `fssaiNumber`: string
   - `moisturePercentage`: number
   - `blockchainTxHash`: string
   - `verificationStatus`: 'VERIFIED' | 'SUSPICIOUS' | 'INVALID'

7. `support_tickets`
   - `id`: string (`HC-T-1023`)
   - `beekeeperId`: string
   - `hiveId`: string
   - `alertId`: string
   - `prefilledTelemetry`: object
   - `messages`: TicketMessage[]
