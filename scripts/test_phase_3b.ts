/**
 * Phase 3B Test Suite
 * Validates:
 * 1. Backend starts
 * 2. GET /api/admin/stats without authentication → 401
 * 3. GET /api/admin/stats with non-admin role → 403
 * 4. GET /api/admin/stats with KVIC_ADMIN → 200
 * 5. Admin stats contain correct Firestore aggregate counts
 * 6. GET /api/beekeepers without authentication → 401
 * 7. GET /api/beekeepers with non-admin role → 403
 * 8. GET /api/beekeepers with KVIC_ADMIN → 200
 * 9. Beekeeper directory returns expected records
 * 10. Admin frontend loads statistics through API (getAdminSystemStats)
 * 11. Admin frontend loads Beekeepers Directory through API (getAdminBeekeepers)
 * 12. Existing Beekeeper functionality still works
 * 13. Existing Consumer verification still works
 */

import 'dotenv/config';

if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  Object.assign((import.meta as any).env, process.env);
}

import http from 'http';
import { app } from '../backend/src/app';
import { auth, db, isFirebaseConfigured } from '../src/services/firebase.service';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getAdminSystemStats, getAdminBeekeepers } from '../src/services/api/admin.api';
import { firestoreIdentityService } from '../src/services/firestore';

const TEST_PORT = 5098;

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

async function runPhase3BTests() {
  console.log('====================================================');
  console.log('  PHASE 3B — ADMIN STATS + BEEKEEPERS API TEST SUITE ');
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
    // Test 1: Server running
    // ----------------------------------------------------
    console.log('--- 1. Backend Server Lifecycle ---');
    const health = await request('GET', '/api/health');
    assert(health.status === 200, 'Backend starts and health check returns 200');

    // ----------------------------------------------------
    // Test 2 & 3: Unauthenticated & Beekeeper checks on /api/admin/stats
    // ----------------------------------------------------
    console.log('\n--- 2. GET /api/admin/stats Security & Authorization ---');
    const unauthStats = await request('GET', '/api/admin/stats');
    assert(
      unauthStats.status === 401,
      'GET /api/admin/stats without authentication returns HTTP 401',
      unauthStats.status
    );

    // Sign in as Beekeeper to obtain non-admin token
    console.log('Signing in as Beekeeper (beekeeper@example.com)...');
    const bkCred = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
    const bkToken = await bkCred.user.getIdToken();

    const bkStats = await request('GET', '/api/admin/stats', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      bkStats.status === 403,
      'GET /api/admin/stats with non-admin role returns HTTP 403 Forbidden',
      bkStats.status
    );
    assert(
      bkStats.body?.message?.includes('not authorized') || bkStats.body?.success === false,
      '403 response contains appropriate rejection message'
    );

    // ----------------------------------------------------
    // Test 4 & 5: Admin access to /api/admin/stats
    // ----------------------------------------------------
    console.log('\n--- 3. GET /api/admin/stats with KVIC_ADMIN ---');
    await signOut(auth);
    console.log('Signing in as KVIC Admin (admin@example.com)...');
    const adminCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
    const adminToken = await adminCred.user.getIdToken();

    const adminStats = await request('GET', '/api/admin/stats', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(
      adminStats.status === 200,
      'GET /api/admin/stats with KVIC_ADMIN returns HTTP 200',
      adminStats.status
    );
    assert(adminStats.body?.success === true, 'Admin stats response has success: true');

    const statsData = adminStats.body?.data;
    assert(typeof statsData?.registeredBeekeepers === 'number', 'registeredBeekeepers is a number');
    assert(statsData?.registeredBeekeepers >= 2, `registeredBeekeepers count >= 2 (actual: ${statsData?.registeredBeekeepers})`);
    assert(typeof statsData?.activeApiaries === 'number', 'activeApiaries is a number');
    assert(statsData?.activeApiaries >= 3, `activeApiaries count >= 3 (actual: ${statsData?.activeApiaries})`);
    assert(typeof statsData?.registeredHives === 'number', 'registeredHives is a number');
    assert(statsData?.registeredHives >= 6, `registeredHives count >= 6 (actual: ${statsData?.registeredHives})`);
    assert(typeof statsData?.honeyBatches === 'number', 'honeyBatches is a number');
    assert(statsData?.honeyBatches >= 1, `honeyBatches count >= 1 (actual: ${statsData?.honeyBatches})`);
    assert(statsData?.tickets !== undefined, 'tickets summary object present');

    // ----------------------------------------------------
    // Test 6 & 7: Unauthenticated & Beekeeper checks on /api/beekeepers
    // ----------------------------------------------------
    console.log('\n--- 4. GET /api/beekeepers Security & Authorization ---');
    const unauthBk = await request('GET', '/api/beekeepers');
    assert(
      unauthBk.status === 401,
      'GET /api/beekeepers without authentication returns HTTP 401',
      unauthBk.status
    );

    const bkBeekeepers = await request('GET', '/api/beekeepers', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      bkBeekeepers.status === 403,
      'GET /api/beekeepers with non-admin role returns HTTP 403 Forbidden',
      bkBeekeepers.status
    );

    // ----------------------------------------------------
    // Test 8 & 9: Admin access to /api/beekeepers
    // ----------------------------------------------------
    console.log('\n--- 5. GET /api/beekeepers with KVIC_ADMIN ---');
    const adminBeekeepers = await request('GET', '/api/beekeepers', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(
      adminBeekeepers.status === 200,
      'GET /api/beekeepers with KVIC_ADMIN returns HTTP 200',
      adminBeekeepers.status
    );
    assert(adminBeekeepers.body?.success === true, 'Beekeepers response has success: true');

    const beekeepersList = adminBeekeepers.body?.data;
    assert(Array.isArray(beekeepersList), 'Beekeepers data is an array');
    assert(beekeepersList.length >= 2, `Directory contains >= 2 beekeepers (actual: ${beekeepersList.length})`);

    const ramesh = beekeepersList.find((b: any) => b.name?.includes('Ramesh') || b.email?.includes('beekeeper'));
    assert(Boolean(ramesh), 'Directory includes Ramesh Patil');
    assert(Boolean(ramesh?.beekeeperId), `Beekeeper record contains beekeeperId (${ramesh?.beekeeperId})`);
    assert(Boolean(ramesh?.district), `Beekeeper record contains district (${ramesh?.district})`);
    assert(ramesh?.telemetry === undefined, 'Lightweight record excludes raw IoT telemetry');
    assert(ramesh?.hives === undefined, 'Lightweight record excludes nested hive trees (on-demand)');

    // ----------------------------------------------------
    // Test 10: District Filter check
    // ----------------------------------------------------
    console.log('\n--- 6. District Query Filter on /api/beekeepers ---');
    const filteredRes = await request('GET', '/api/beekeepers?district=Nashik', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(filteredRes.status === 200, 'GET /api/beekeepers?district=Nashik returns HTTP 200');
    assert(
      filteredRes.body?.data?.every((b: any) => b.district.toLowerCase() === 'nashik'),
      'All filtered beekeepers belong to district Nashik'
    );

    // ----------------------------------------------------
    // Test 11: Frontend API Service Functions
    // ----------------------------------------------------
    console.log('\n--- 7. Frontend API Service Client Integration ---');
    const { apiClient } = await import('../src/services/api/apiClient');
    apiClient.setBaseUrl(`http://127.0.0.1:${TEST_PORT}/api`);
    const frontendStats = await getAdminSystemStats();
    assert(
      typeof frontendStats.registeredBeekeepers === 'number',
      'getAdminSystemStats() successfully retrieves aggregate stats via Express API'
    );
    assert(
      frontendStats.registeredBeekeepers === statsData.registeredBeekeepers,
      'Frontend API stats match server response exactly'
    );

    const frontendBeekeepers = await getAdminBeekeepers();
    assert(
      Array.isArray(frontendBeekeepers) && frontendBeekeepers.length >= 2,
      'getAdminBeekeepers() successfully retrieves directory via Express API'
    );

    // ----------------------------------------------------
    // Test 12: Regression — Beekeeper functionality
    // ----------------------------------------------------
    console.log('\n--- 8. Beekeeper Functionality Regression Check ---');
    await signOut(auth);
    const bkLogin = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
    const profileData = await firestoreIdentityService.loadAuthenticatedProfile(bkLogin.user.uid);
    assert(profileData.beekeeperProfile?.name === 'Ramesh Patil', 'Beekeeper profile loads correctly');
    assert(profileData.hives.length >= 2, 'Beekeeper hives load correctly');

    // ----------------------------------------------------
    // Test 13: Regression — Consumer public verification
    // ----------------------------------------------------
    console.log('\n--- 9. Consumer Public Verification Regression Check ---');
    await signOut(auth);
    const publicBatch = await firestoreIdentityService.loadPublicBatch('HC-MH-NAS-2026-00047');
    assert(publicBatch !== null, 'Public batch HC-MH-NAS-2026-00047 retrieved');
    assert(publicBatch?.verificationStatus === 'VERIFIED', 'Public batch is VERIFIED');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('\n[TestServer] Stopped.');
  }

  console.log('\n====================================================');
  console.log(`Phase 3B Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase3BTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
