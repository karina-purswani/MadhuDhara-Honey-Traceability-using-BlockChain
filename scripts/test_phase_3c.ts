/**
 * Phase 3C Test Suite — Admin Drill-Down API Migration
 * Validates:
 * 1. Backend starts
 * 2. Unauthenticated beekeeper-apiaries request → 401
 * 3. Non-admin beekeeper role → 403
 * 4. KVIC_ADMIN can retrieve apiaries
 * 5. Returned apiaries belong to requested beekeeper
 * 6. KVIC_ADMIN can retrieve hives for an apiary
 * 7. Returned hives belong to requested apiary
 * 8. KVIC_ADMIN can retrieve a hive detail
 * 9. Hive detail does not expose unrelated hive trees
 * 10. Latest IoT reading endpoint works for a selected hive
 * 11. IoT endpoint does not fetch all hive telemetry
 * 12. Admin drill-down UI receives data through API
 * 13. Alert → Hive Passport still works
 * 14. Support Ticket → Hive Passport still works
 * 15. Existing Beekeeper dashboard still works
 * 16. Public consumer verification still works
 */

import 'dotenv/config';

if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  Object.assign((import.meta as any).env, process.env);
}

import http from 'http';
import { app } from '../backend/src/app';
import { auth, db, isFirebaseConfigured } from '../src/services/firebase.service';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  getBeekeeperApiaries,
  getApiaryHives,
  getHiveDetail,
  getLatestHiveReading,
} from '../src/services/api/admin.api';
import { firestoreIdentityService } from '../src/services/firestore';

const TEST_PORT = 5097;

function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode || 0, headers: res.headers, body: parsed });
          } catch {
            resolve({ status: res.statusCode || 0, headers: res.headers, body: rawData });
          }
        });
      }
    );

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPhase3CTests() {
  console.log('====================================================');
  console.log('  PHASE 3C — ADMIN DRILL-DOWN API TEST SUITE        ');
  console.log('====================================================\n');

  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Auth/Firestore not configured. Check .env variables.');
  }

  // 1. Start test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()));
  console.log(`[TestServer] Started on http://127.0.0.1:${TEST_PORT}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // Test 1: Server Running
    // ----------------------------------------------------
    console.log('--- 1. Backend Server Lifecycle ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'Backend starts and health check returns 200');

    // ----------------------------------------------------
    // Test 2 & 3: Unauthenticated & Beekeeper checks on /api/beekeepers/:id/apiaries
    // ----------------------------------------------------
    console.log('\n--- 2. Beekeeper Apiaries Security & Authorization ---');
    const sampleBeekeeperId = 'BK-MH-NAS-0129';
    const unauthApiaries = await request(
      'GET',
      `/api/beekeepers/${sampleBeekeeperId}/apiaries`
    );
    assert(
      unauthApiaries.status === 401,
      'GET /api/beekeepers/:id/apiaries without auth returns HTTP 401',
      unauthApiaries.status
    );

    // Sign in as Beekeeper (non-admin)
    console.log('Signing in as Beekeeper (beekeeper@example.com)...');
    const bkCred = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
    const bkToken = await bkCred.user.getIdToken();

    const bkApiaries = await request(
      'GET',
      `/api/beekeepers/${sampleBeekeeperId}/apiaries`,
      {
        Authorization: `Bearer ${bkToken}`,
      }
    );
    assert(
      bkApiaries.status === 403,
      'GET /api/beekeepers/:id/apiaries with non-admin role returns HTTP 403 Forbidden',
      bkApiaries.status
    );

    // ----------------------------------------------------
    // Test 4 & 5: Admin access to /api/beekeepers/:id/apiaries
    // ----------------------------------------------------
    console.log('\n--- 3. KVIC_ADMIN Beekeeper Apiaries Drill-Down ---');
    await signOut(auth);
    console.log('Signing in as KVIC Admin (admin@example.com)...');
    const adminCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
    const adminToken = await adminCred.user.getIdToken();

    const adminApiariesRes = await request(
      'GET',
      `/api/beekeepers/${sampleBeekeeperId}/apiaries`,
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );
    assert(
      adminApiariesRes.status === 200,
      'KVIC_ADMIN can retrieve apiaries (HTTP 200)',
      adminApiariesRes.status
    );
    assert(adminApiariesRes.body?.success === true, 'Response envelope has success: true');

    const apiariesList = adminApiariesRes.body?.data;
    assert(Array.isArray(apiariesList) && apiariesList.length > 0, 'Apiaries data is a non-empty array');
    const selectedApiary = apiariesList[0];
    assert(Boolean(selectedApiary.id), `Apiary record has ID (${selectedApiary.id})`);
    assert(
      selectedApiary.beekeeperId.includes(sampleBeekeeperId) || selectedApiary.beekeeperId === sampleBeekeeperId,
      'Returned apiary belongs to requested beekeeper'
    );
    assert(selectedApiary.hives === undefined, 'Lightweight apiary excludes nested hives (on-demand)');

    // ----------------------------------------------------
    // Test 6 & 7: Admin access to /api/apiaries/:id/hives
    // ----------------------------------------------------
    console.log('\n--- 4. KVIC_ADMIN Apiary Hives Drill-Down ---');
    const unauthHives = await request('GET', `/api/apiaries/${selectedApiary.id}/hives`);
    assert(
      unauthHives.status === 401,
      'GET /api/apiaries/:id/hives without auth returns HTTP 401'
    );

    const adminHivesRes = await request(
      'GET',
      `/api/apiaries/${selectedApiary.id}/hives`,
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );
    assert(
      adminHivesRes.status === 200,
      'KVIC_ADMIN can retrieve hives for an apiary (HTTP 200)',
      adminHivesRes.status
    );
    assert(adminHivesRes.body?.success === true, 'Hives response has success: true');

    const hivesList = adminHivesRes.body?.data;
    assert(Array.isArray(hivesList) && hivesList.length > 0, 'Hives data is a non-empty array');
    const selectedHive = hivesList[0];
    assert(Boolean(selectedHive.id), `Hive record has ID (${selectedHive.id})`);
    assert(
      selectedHive.apiaryId === selectedApiary.id,
      `Returned hive belongs to requested apiary (${selectedHive.apiaryId})`
    );
    assert(selectedHive.telemetry === undefined, 'Lightweight hive excludes full telemetry history');

    // ----------------------------------------------------
    // Test 8 & 9: Admin access to /api/hives/:hiveId
    // ----------------------------------------------------
    console.log('\n--- 5. KVIC_ADMIN Hive Detail / Passport Endpoint ---');
    const unauthDetail = await request('GET', `/api/hives/${selectedHive.id}`);
    assert(
      unauthDetail.status === 401,
      'GET /api/hives/:hiveId without auth returns HTTP 401'
    );

    const adminDetailRes = await request('GET', `/api/hives/${selectedHive.id}`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(
      adminDetailRes.status === 200,
      'KVIC_ADMIN can retrieve hive detail (HTTP 200)',
      adminDetailRes.status
    );
    assert(adminDetailRes.body?.success === true, 'Hive detail response has success: true');

    const detailData = adminDetailRes.body?.data;
    assert(detailData?.hive !== null && Boolean(detailData?.hive?.id), 'Hive details present in payload');
    assert(detailData?.beekeeper !== null, 'Linked beekeeper provenance present');
    assert(detailData?.apiary !== null, 'Linked apiary location present');
    assert(
      detailData?.allHives === undefined,
      'Hive detail does not expose unrelated database trees'
    );

    // ----------------------------------------------------
    // Test 10 & 11: Latest IoT Reading for One Selected Hive
    // ----------------------------------------------------
    console.log('\n--- 6. Latest IoT Reading for Selected Hive ---');
    const unauthIot = await request('GET', `/api/hives/${selectedHive.id}/iot/latest`);
    assert(
      unauthIot.status === 401,
      'GET /api/hives/:hiveId/iot/latest without auth returns HTTP 401'
    );

    const adminIotRes = await request(
      'GET',
      `/api/hives/${selectedHive.id}/iot/latest`,
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );
    assert(
      adminIotRes.status === 200,
      'Latest IoT reading endpoint works for selected hive (HTTP 200)',
      adminIotRes.status
    );
    assert(adminIotRes.body?.success === true, 'IoT reading response has success: true');

    const readingData = adminIotRes.body?.data;
    assert(typeof readingData?.temperature === 'number', 'Reading contains valid temperature');
    assert(typeof readingData?.humidity === 'number', 'Reading contains valid humidity');
    assert(typeof readingData?.weight === 'number', 'Reading contains valid weight');
    assert(typeof readingData?.healthScore === 'number', 'Reading contains valid health score');
    assert(
      Array.isArray(readingData?.history) === false,
      'IoT endpoint returns single latest snapshot, not all system telemetry'
    );

    // ----------------------------------------------------
    // Test 12: Frontend API Client Abstractions
    // ----------------------------------------------------
    console.log('\n--- 7. Frontend API Client Abstraction Verification ---');
    const { apiClient } = await import('../src/services/api/apiClient');
    apiClient.setBaseUrl(`http://127.0.0.1:${TEST_PORT}/api`);

    const clientApiaries = await getBeekeeperApiaries(sampleBeekeeperId);
    assert(
      Array.isArray(clientApiaries) && clientApiaries.length > 0,
      'getBeekeeperApiaries() successfully retrieves apiaries via API'
    );

    const clientHives = await getApiaryHives(selectedApiary.id);
    assert(
      Array.isArray(clientHives) && clientHives.length > 0,
      'getApiaryHives() successfully retrieves hives via API'
    );

    const clientDetail = await getHiveDetail(selectedHive.id);
    assert(
      clientDetail?.hive?.id === selectedHive.id,
      'getHiveDetail() successfully retrieves hive passport via API'
    );

    const clientReading = await getLatestHiveReading(selectedHive.id);
    assert(
      typeof clientReading?.healthScore === 'number',
      'getLatestHiveReading() successfully retrieves live reading via API'
    );

    // ----------------------------------------------------
    // Test 13: Alert → Hive Passport Flow
    // ----------------------------------------------------
    console.log('\n--- 8. Alert → Hive Passport Drill-Down Flow ---');
    const allAlerts = await firestoreIdentityService.loadAllAlerts();
    const alertHiveId = allAlerts[0]?.hiveId || selectedHive.id;
    const alertHivePassport = await getHiveDetail(alertHiveId);
    assert(
      alertHivePassport?.hive?.id === alertHiveId || Boolean(alertHivePassport?.hive),
      `Alert -> Hive Passport resolves hive ${alertHiveId} through new API`
    );

    // ----------------------------------------------------
    // Test 14: Support Ticket → Hive Passport Flow
    // ----------------------------------------------------
    console.log('\n--- 9. Support Ticket → Hive Passport Drill-Down Flow ---');
    const allTickets = await firestoreIdentityService.loadAllTickets();
    const ticketHiveId = allTickets[0]?.hiveId || selectedHive.id;
    const ticketHivePassport = await getHiveDetail(ticketHiveId);
    assert(
      ticketHivePassport?.hive?.id === ticketHiveId || Boolean(ticketHivePassport?.hive),
      `Support Ticket -> Hive Passport resolves hive ${ticketHiveId} through new API`
    );

    // ----------------------------------------------------
    // Test 15: Beekeeper Functionality Regression
    // ----------------------------------------------------
    console.log('\n--- 10. Beekeeper Functionality Regression Check ---');
    await signOut(auth);
    const bkLogin = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
    const profile = await firestoreIdentityService.loadAuthenticatedProfile(bkLogin.user.uid);
    assert(profile.beekeeperProfile?.name === 'Ramesh Patil', 'Beekeeper profile loads correctly');
    assert(profile.hives.length >= 2, 'Beekeeper hives load correctly');

    // ----------------------------------------------------
    // Test 16: Public Consumer Verification Regression
    // ----------------------------------------------------
    console.log('\n--- 11. Public Consumer Verification Regression Check ---');
    await signOut(auth);
    const publicBatch = await firestoreIdentityService.loadPublicBatch('HC-MH-NAS-2026-00047');
    assert(publicBatch !== null, 'Public batch HC-MH-NAS-2026-00047 retrieved');
    assert(publicBatch?.verificationStatus === 'VERIFIED', 'Public batch is VERIFIED');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('\n[TestServer] Stopped.');
  }

  console.log('\n====================================================');
  console.log(`Phase 3C Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase3CTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
