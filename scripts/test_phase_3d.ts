/**
 * Phase 3D Comprehensive Integration Test Suite
 * Remaining Core API Migration:
 * 1. Harvests API (/api/harvests)
 * 2. Batches API (/api/batches)
 * 3. Public Batch Verification & Traceability (/api/public/batches/:batchNumber)
 * 4. Alerts API (/api/alerts)
 * 5. Support Tickets API (/api/tickets)
 * 6. Learning Hub API (/api/learning)
 * 7. Marketplace API (/api/marketplace)
 * 8. Order Requests API (/api/orders)
 * 9. Regression Suite (Admin Stats, Drill-Down, Hive Passport, IoT simulator)
 */

import 'dotenv/config';

if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  Object.assign((import.meta as any).env, process.env);
}

import http from 'http';
import { app } from '../backend/src/app';
import { auth, db, isFirebaseConfigured } from '../src/services/firebase.service';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { apiClient } from '../src/services/api/apiClient';
import { getHarvests } from '../src/services/api/harvests.api';
import { getBatches, createBatch } from '../src/services/api/batches.api';
import { getPublicBatch } from '../src/services/api/public.api';
import { getAlerts, acknowledgeAlert } from '../src/services/api/alerts.api';
import { getTickets, createTicket, addTicketMessage } from '../src/services/api/tickets.api';
import { getLearningContent, publishLearningContent } from '../src/services/api/learning.api';
import { getMarketplaceProducts, createMarketplaceProduct } from '../src/services/api/marketplace.api';
import { getOrderRequests, createOrderRequest } from '../src/services/api/orders.api';
import { getAdminSystemStats, getAdminBeekeepers } from '../src/services/api/admin.api';

const TEST_PORT = 5096;

function rawRequest(
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

async function runPhase3DTests() {
  console.log('====================================================');
  console.log('  PHASE 3D — REMAINING CORE API MIGRATION TEST SUITE');
  console.log('====================================================\n');

  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase Auth/Firestore not configured. Check .env variables.');
  }

  // 1. Start test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()));
  console.log(`[TestServer] Started on http://127.0.0.1:${TEST_PORT}\n`);

  apiClient.setBaseUrl(`http://127.0.0.1:${TEST_PORT}/api`);

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
    // Authenticate users
    console.log('--- Setting up test sessions ---');
    console.log('Signing in as Beekeeper (beekeeper@example.com)...');
    const bkCred = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
    const bkToken = await bkCred.user.getIdToken();
    const bkUid = bkCred.user.uid;
    console.log(`Beekeeper signed in. UID: ${bkUid}`);

    // ====================================================
    // MODULE 1: HARVESTS
    // ====================================================
    console.log('\n--- 1. HARVESTS API ---');
    // 1. Beekeeper can access own harvests
    const bkHarvestsRes = await rawRequest('GET', '/api/harvests', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(bkHarvestsRes.status === 200, 'Test 1: Beekeeper can access own harvests (HTTP 200)');
    assert(
      Array.isArray(bkHarvestsRes.body.data),
      'Harvests payload is an array',
      bkHarvestsRes.body
    );

    // 2. Beekeeper cannot access another beekeeper's harvest
    const crossHarvestRes = await rawRequest('GET', '/api/harvests/HV-OTHER-99999', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      crossHarvestRes.status === 404 || crossHarvestRes.status === 403,
      "Test 2: Beekeeper cannot access another beekeeper's harvest (403/404)",
      crossHarvestRes.status
    );

    // ====================================================
    // MODULE 2: BATCHES
    // ====================================================
    console.log('\n--- 2. BATCHES API ---');
    // 3. Beekeeper can access own batches
    const bkBatchesRes = await rawRequest('GET', '/api/batches', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(bkBatchesRes.status === 200, 'Test 3: Beekeeper can access own batches (HTTP 200)');
    assert(Array.isArray(bkBatchesRes.body.data), 'Batches payload is an array');

    // 4. Beekeeper cannot access another beekeeper's batch
    const crossBatchRes = await rawRequest('GET', '/api/batches/HC-OTHER-UNKNOWN-999', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      crossBatchRes.status === 404 || crossBatchRes.status === 403,
      "Test 4: Beekeeper cannot access another beekeeper's private batch (403/404)",
      crossBatchRes.status
    );

    // ====================================================
    // MODULE 3: PUBLIC BATCH VERIFICATION
    // ====================================================
    console.log('\n--- 3. PUBLIC BATCH VERIFICATION ---');
    // 5. Public batch verification works & privacy verification
    const knownBatchNumber = 'HC-MH-NAS-2026-00047';
    const publicBatchRes = await rawRequest('GET', `/api/public/batches/${knownBatchNumber}`);
    assert(publicBatchRes.status === 200, 'Test 5: Public batch verification works without login');
    assert(
      publicBatchRes.body.data?.batchNumber === knownBatchNumber,
      'Public batch contains correct batchNumber'
    );
    assert(
      publicBatchRes.body.data?.verificationStatus === 'VERIFIED',
      'Public batch has VERIFIED status'
    );
    assert(
      Array.isArray(publicBatchRes.body.data?.events),
      'Public batch includes traceability timeline events'
    );
    // Privacy check: ensure sensitive PII is stripped
    assert(
      !publicBatchRes.body.data?.email &&
        !publicBatchRes.body.data?.beekeeperEmail &&
        !publicBatchRes.body.data?.beekeeperPhone &&
        !publicBatchRes.body.data?.phone,
      'Public batch response strictly excludes private contact details (PII stripped)'
    );

    // 6. Invalid public batch returns 404
    const invalidBatchRes = await rawRequest('GET', '/api/public/batches/HC-NON-EXISTENT-99999');
    assert(
      invalidBatchRes.status === 404,
      'Test 6: Invalid public batch returns 404 Not Found',
      invalidBatchRes.status
    );

    // ====================================================
    // MODULE 4: ALERTS
    // ====================================================
    console.log('\n--- 4. ALERTS API ---');
    // 7. Beekeeper can access own alerts
    const bkAlertsRes = await rawRequest('GET', '/api/alerts', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(bkAlertsRes.status === 200, 'Test 7: Beekeeper can access own alerts (HTTP 200)');
    assert(Array.isArray(bkAlertsRes.body.data), 'Alerts payload is an array');

    // 8. Beekeeper cannot access another beekeeper's alert
    const crossAlertRes = await rawRequest(
      'PATCH',
      '/api/alerts/ALT-FOREIGN-BEEKEEPER-999/acknowledge',
      {
        Authorization: `Bearer ${bkToken}`,
      }
    );
    assert(
      crossAlertRes.status === 404 || crossAlertRes.status === 403,
      "Test 8: Beekeeper cannot access/acknowledge another beekeeper's alert (403/404)",
      crossAlertRes.status
    );

    // 9. Alert acknowledgement works (create an alert first, then acknowledge it)
    const newAlertRes = await rawRequest(
      'POST',
      '/api/alerts',
      { Authorization: `Bearer ${bkToken}` },
      {
        hiveId: 'HC-HIVE-MH-NAS-00123',
        alertType: 'temperature',
        severity: 'warning',
        title: 'Integration Test Temp Warning',
        description: 'Testing alert lifecycle in Phase 3D',
        healthScore: 78,
      }
    );
    assert(newAlertRes.status === 201, 'Created new test alert (HTTP 201)');
    const createdAlertId = newAlertRes.body.data?.id;

    if (createdAlertId) {
      const ackRes = await rawRequest(
        'PATCH',
        `/api/alerts/${encodeURIComponent(createdAlertId)}/acknowledge`,
        { Authorization: `Bearer ${bkToken}` }
      );
      assert(ackRes.status === 200, 'Test 9: Alert acknowledgement works (HTTP 200)');
      assert(ackRes.body.data?.acknowledged === true, 'Alert acknowledged field is true');
    }

    // ====================================================
    // MODULE 5: SUPPORT TICKETS
    // ====================================================
    console.log('\n--- 5. SUPPORT TICKETS API ---');
    // 10. Beekeeper can access own tickets
    const bkTicketsRes = await rawRequest('GET', '/api/tickets', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(bkTicketsRes.status === 200, 'Test 10: Beekeeper can access own tickets (HTTP 200)');
    assert(Array.isArray(bkTicketsRes.body.data), 'Tickets payload is an array');

    // 11. Beekeeper cannot access another beekeeper's ticket
    const crossTicketRes = await rawRequest('GET', '/api/tickets/HC-T-FOREIGN-999', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      crossTicketRes.status === 404 || crossTicketRes.status === 403,
      "Test 11: Beekeeper cannot access another beekeeper's ticket (403/404)",
      crossTicketRes.status
    );

    // Create a support ticket as Beekeeper
    const createdTicketRes = await rawRequest(
      'POST',
      '/api/tickets',
      { Authorization: `Bearer ${bkToken}` },
      {
        hiveId: 'HC-HIVE-MH-NAS-00123',
        title: 'Phase 3D Integration Test Ticket',
        message: 'Checking ticket creation via REST API',
        category: 'hive_health',
      }
    );
    assert(createdTicketRes.status === 201, 'Created support ticket via API (HTTP 201)');
    const createdTicketId = createdTicketRes.body.data?.id;

    // 12. Admin can access support tickets
    await signOut(auth);
    console.log('Signing in as KVIC Admin (admin@example.com)...');
    const adminCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
    const adminToken = await adminCred.user.getIdToken();

    const adminTicketsRes = await rawRequest('GET', '/api/tickets', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(adminTicketsRes.status === 200, 'Test 12: Admin can access support tickets (HTTP 200)');
    assert(
      Array.isArray(adminTicketsRes.body.data) && adminTicketsRes.body.data.length > 0,
      'Admin receives list of support tickets'
    );

    // 13. Ticket messages remain private to authorized participants
    if (createdTicketId) {
      // Admin responds to ticket
      const adminMsgRes = await rawRequest(
        'POST',
        `/api/tickets/${encodeURIComponent(createdTicketId)}/messages`,
        { Authorization: `Bearer ${adminToken}` },
        {
          message: 'Officer response: Inspect brood box ventilation.',
          newStatus: 'IN REVIEW',
        }
      );
      assert(adminMsgRes.status === 201, 'Admin can post response message (HTTP 201)');

      // Anonymous consumer cannot read ticket messages
      const anonMsgRes = await rawRequest(
        'GET',
        `/api/tickets/${encodeURIComponent(createdTicketId)}/messages`
      );
      assert(
        anonMsgRes.status === 401,
        'Test 13: Ticket messages reject unauthenticated consumers with HTTP 401'
      );
    }

    // ====================================================
    // MODULE 6: LEARNING HUB
    // ====================================================
    console.log('\n--- 6. LEARNING HUB API ---');
    // 14. Published learning content is accessible to beekeeper
    const bkLearningRes = await rawRequest('GET', '/api/learning', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      bkLearningRes.status === 200,
      'Test 14: Published learning content is accessible to beekeeper (HTTP 200)'
    );
    assert(Array.isArray(bkLearningRes.body.data), 'Learning content payload is an array');

    // 15. Unpublished/Draft content is not shown to beekeeper
    const hasDraftsInBkView = bkLearningRes.body.data?.some((c: any) => c.status === 'draft');
    assert(
      !hasDraftsInBkView,
      'Test 15: Unpublished draft content is not exposed to beekeeper'
    );

    // 16. Admin can manage learning content
    const newLearningRes = await rawRequest(
      'POST',
      '/api/learning',
      { Authorization: `Bearer ${adminToken}` },
      {
        title: 'Phase 3D Advanced Brood Management',
        description: 'Comprehensive guide for seasonal honey yield optimization',
        category: 'beekeeping_basics',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMinutes: 15,
        language: 'en',
      }
    );
    assert(
      newLearningRes.status === 201,
      'Test 16: Admin can create/publish learning content (HTTP 201)'
    );

    // ====================================================
    // MODULE 7: MARKETPLACE
    // ====================================================
    console.log('\n--- 7. MARKETPLACE API ---');
    // 17. Public active listings are accessible without login
    const publicMarketplaceRes = await rawRequest('GET', '/api/marketplace/products');
    assert(
      publicMarketplaceRes.status === 200,
      'Test 17: Public active marketplace listings are accessible (HTTP 200)'
    );
    assert(
      Array.isArray(publicMarketplaceRes.body.data),
      'Marketplace listings payload is an array'
    );

    // 18. Beekeeper can access/manage own listings
    const myProductsRes = await rawRequest('GET', '/api/marketplace/products?my=true', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      myProductsRes.status === 200,
      'Test 18: Beekeeper can access own marketplace listings (HTTP 200)'
    );

    // 19. Beekeeper cannot manage/delete another beekeeper's listing
    const foreignProdDeleteRes = await rawRequest(
      'DELETE',
      '/api/marketplace/products/MP-FOREIGN-SELLER-999',
      { Authorization: `Bearer ${bkToken}` }
    );
    assert(
      foreignProdDeleteRes.status === 403 || foreignProdDeleteRes.status === 404,
      "Test 19: Beekeeper cannot delete another beekeeper's product listing (403/404)",
      foreignProdDeleteRes.status
    );

    // ====================================================
    // MODULE 8: ORDER REQUESTS
    // ====================================================
    console.log('\n--- 8. ORDER REQUESTS API ---');
    // 20. Consumer can submit order/enquiry without login
    const sampleProduct = publicMarketplaceRes.body.data?.[0];
    const orderSubmissionRes = await rawRequest(
      'POST',
      '/api/orders',
      {},
      {
        productId: sampleProduct?.id || 'MP-DEMO-01',
        batchNumber: sampleProduct?.batchId || knownBatchNumber,
        beekeeperUid: sampleProduct?.beekeeperUid || bkUid,
        consumerName: 'Amit Consumer',
        consumerContact: '9876543210',
        consumerMessage: 'I would like to order 2 jars of this certified honey batch.',
        requestedQuantity: 2,
      }
    );
    assert(
      orderSubmissionRes.status === 201,
      'Test 20: Public consumer can submit order/enquiry without login (HTTP 201)'
    );

    // 21. Beekeeper can see requests for own listings
    const bkOrdersRes = await rawRequest('GET', '/api/orders', {
      Authorization: `Bearer ${bkToken}`,
    });
    assert(
      bkOrdersRes.status === 200,
      'Test 21: Beekeeper can view order requests for own products (HTTP 200)'
    );

    // 22. Unrelated beekeeper cannot see another beekeeper's orders
    // The backend scopes getOrderRequestsByBeekeeper to user.uid
    const bkOrders = bkOrdersRes.body.data || [];
    const hasUnrelatedOrders = bkOrders.some((o: any) => o.beekeeperUid && o.beekeeperUid !== bkUid);
    assert(
      !hasUnrelatedOrders,
      'Test 22: Beekeeper does not receive unrelated seller orders'
    );

    // ====================================================
    // MODULE 9: REGRESSION CHECKS
    // ====================================================
    console.log('\n--- 9. REGRESSION CHECKS ---');
    // 23. Existing Admin APIs still work
    const adminStats = await getAdminSystemStats();
    assert(
      adminStats !== null && typeof adminStats.registeredBeekeepers === 'number',
      'Test 23: Existing Admin System Stats API still works'
    );

    const beekeepersDir = await getAdminBeekeepers();
    assert(
      Array.isArray(beekeepersDir) && beekeepersDir.length > 0,
      'Existing Beekeepers Directory API still works'
    );

    // 24. Existing Admin drill-down still works
    const adminDrilldownRes = await rawRequest(
      'GET',
      '/api/beekeepers/BK-MH-NAS-0129/apiaries',
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      adminDrilldownRes.status === 200,
      'Test 24: Existing Admin drill-down /api/beekeepers/:id/apiaries still works'
    );

    // 25. Existing Hive Passport still works
    const hivePassportRes = await rawRequest(
      'GET',
      '/api/hives/HC-HIVE-MH-NAS-00123',
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      hivePassportRes.status === 200,
      'Test 25: Existing Hive Passport /api/hives/:hiveId still works'
    );

    // 26. Existing IoT simulator still works
    const iotReadingRes = await rawRequest(
      'GET',
      '/api/hives/HC-HIVE-MH-NAS-00123/iot/latest',
      { Authorization: `Bearer ${adminToken}` }
    );
    assert(
      iotReadingRes.status === 200 && typeof iotReadingRes.body.data?.temperature === 'number',
      'Test 26: Existing IoT telemetry /api/hives/:hiveId/iot/latest still works'
    );

    // 27. Existing consumer batch verification still works via frontend public API client
    const clientPublicBatch = await getPublicBatch(knownBatchNumber);
    assert(
      clientPublicBatch !== null && clientPublicBatch.batchNumber === knownBatchNumber,
      'Test 27: Existing consumer batch verification client function getPublicBatch works'
    );
  } finally {
    server.close();
    console.log('\n[TestServer] Stopped.');
  }

  console.log('\n====================================================');
  console.log(`Phase 3D Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3DTests().catch((err) => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
