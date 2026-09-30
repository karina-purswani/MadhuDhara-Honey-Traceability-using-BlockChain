/**
 * Phase 3A Test Suite
 * Validates:
 * 1. Server initialization & lifecycle
 * 2. GET /api/health returns 200 & valid JSON payload
 * 3. 404 API handling
 * 4. Authentication middleware rejection of missing/invalid tokens (401)
 * 5. Foundation route availability
 * 6. Frontend apiClient abstraction
 * 7. Regression integrity of existing Firestore services
 */

import http from 'http';
import { app } from '../backend/src/app';
import { firestoreApiaryRepository } from '../src/services/firestore/apiary.repository';
import { firestoreBatchRepository } from '../src/services/firestore/batch.repository';
import { firestoreAlertRepository } from '../src/services/firestore/alert.repository';
import { firestoreTicketRepository } from '../src/services/firestore/ticket.repository';
import { firestoreLearningRepository } from '../src/services/firestore/learning.repository';
import { firestoreMarketplaceRepository } from '../src/services/firestore/marketplace.repository';

const TEST_PORT = 5099;

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

async function runTests() {
  console.log('====================================================');
  console.log('     PHASE 3A BACKEND FOUNDATION TEST SUITE         ');
  console.log('====================================================\n');

  // Start test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()));
  console.log(`[TestServer] Running at http://127.0.0.1:${TEST_PORT}\n`);

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
    // 1. Health check
    console.log('--- 1. Health Check Endpoint ---');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns HTTP 200', healthRes.status);
    assert(healthRes.body?.status === 'ok', 'Health response status is "ok"', healthRes.body);
    assert(
      healthRes.body?.service === 'MadhuDhara API',
      'Health response service name is "MadhuDhara API"',
      healthRes.body
    );
    assert(Boolean(healthRes.body?.timestamp), 'Health response includes valid timestamp');

    // 2. 404 Handler
    console.log('\n--- 2. Centralized 404 Handler ---');
    const notFoundRes = await request('GET', '/api/non-existent-route-xyz');
    assert(notFoundRes.status === 404, 'Unknown API route returns HTTP 404', notFoundRes.status);
    assert(notFoundRes.body?.success === false, '404 envelope has success: false', notFoundRes.body);
    assert(
      typeof notFoundRes.body?.message === 'string' &&
        notFoundRes.body?.message.includes('not found'),
      '404 envelope contains informative message',
      notFoundRes.body
    );

    // 3. Authentication & Security Middleware
    console.log('\n--- 3. Authentication Middleware ---');
    const unauthRes = await request('GET', '/api/auth/me');
    assert(
      unauthRes.status === 401,
      'Protected GET /api/auth/me without token returns HTTP 401',
      unauthRes.status
    );
    assert(unauthRes.body?.success === false, '401 response has success: false', unauthRes.body);

    const malformedTokenRes = await request('GET', '/api/auth/me', {
      Authorization: 'Bearer invalid.fake.token',
    });
    assert(
      malformedTokenRes.status === 401,
      'Protected route with invalid token returns HTTP 401',
      malformedTokenRes.status
    );

    // 4. Role Authorization Foundation
    console.log('\n--- 4. Role Authorization Middleware ---');
    const adminUnauthRes = await request('GET', '/api/admin/status');
    assert(
      adminUnauthRes.status === 401,
      'Admin route /api/admin/status rejects unauthenticated request with HTTP 401',
      adminUnauthRes.status
    );

    // 5. Public Consumer Route (No Auth Required)
    console.log('\n--- 5. Public Consumer Routes ---');
    const publicRes = await request('GET', '/api/public/status');
    assert(
      publicRes.status === 200,
      'Public route /api/public/status allows access without auth (HTTP 200)',
      publicRes.status
    );
    assert(
      publicRes.body?.data?.role === 'PUBLIC_CONSUMER',
      'Public route specifies role PUBLIC_CONSUMER',
      publicRes.body
    );

    // 6. Foundation Modular Routes
    console.log('\n--- 6. Modular Route Architectures ---');
    const beekeepersRes = await request('GET', '/api/beekeepers/status');
    assert(beekeepersRes.status === 200, '/api/beekeepers/status returns 200');
    assert(beekeepersRes.body?.data?.module === 'beekeepers', 'Beekeepers module identified');

    const batchesRes = await request('GET', '/api/batches/status');
    assert(batchesRes.status === 200, '/api/batches/status returns 200');
    assert(batchesRes.body?.data?.module === 'batches', 'Batches module identified');

    const hivesRes = await request('GET', '/api/hives/status');
    assert(hivesRes.status === 200, '/api/hives/status returns 200');
    assert(hivesRes.body?.data?.module === 'hives', 'Hives module identified');

    const ticketsRes = await request('GET', '/api/tickets/status');
    assert(ticketsRes.status === 200, '/api/tickets/status returns 200');
    assert(ticketsRes.body?.data?.module === 'tickets', 'Tickets module identified');

    const learningRes = await request('GET', '/api/learning/status');
    assert(learningRes.status === 200, '/api/learning/status returns 200');
    assert(learningRes.body?.data?.module === 'learning', 'Learning module identified');

    const marketplaceRes = await request('GET', '/api/marketplace/status');
    assert(marketplaceRes.status === 200, '/api/marketplace/status returns 200');
    assert(marketplaceRes.body?.data?.module === 'marketplace', 'Marketplace module identified');

    // 7. Regression Verification of Existing Firestore Services
    console.log('\n--- 7. Existing Firestore Services Regression Check ---');
    assert(typeof firestoreApiaryRepository.createApiary === 'function', 'firestoreApiaryRepository.createApiary exists');
    assert(typeof firestoreBatchRepository.getBatchesByBeekeeper === 'function', 'firestoreBatchRepository.getBatchesByBeekeeper exists');
    assert(typeof firestoreAlertRepository.getAllAlerts === 'function', 'firestoreAlertRepository.getAllAlerts exists');
    assert(typeof firestoreTicketRepository.getAllTickets === 'function', 'firestoreTicketRepository.getAllTickets exists');
    assert(typeof firestoreLearningRepository.getAllPublishedLearningContent === 'function', 'firestoreLearningRepository.getAllPublishedLearningContent exists');
    assert(typeof firestoreMarketplaceRepository.getAllProducts === 'function', 'firestoreMarketplaceRepository.getAllProducts exists');

    // 8. Frontend API Client Abstraction Check
    console.log('\n--- 8. Frontend API Client Abstraction Check ---');
    const { apiClient } = await import('../src/services/api/apiClient');
    assert(typeof apiClient.get === 'function', 'apiClient.get is a function');
    assert(typeof apiClient.post === 'function', 'apiClient.post is a function');
    assert(typeof apiClient.put === 'function', 'apiClient.put is a function');
    assert(typeof apiClient.patch === 'function', 'apiClient.patch is a function');
    assert(typeof apiClient.delete === 'function', 'apiClient.delete is a function');
    assert(typeof apiClient.checkHealth === 'function', 'apiClient.checkHealth is a function');

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    console.log('\n[TestServer] Stopped.');
  }

  console.log('\n====================================================');
  console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
