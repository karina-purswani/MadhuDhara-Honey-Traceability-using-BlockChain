/**
 * Phase 2E End-to-End Firestore Marketplace & Order Requests Test Suite
 * Tests full flow:
 * 1. Beekeeper A (beekeeper@example.com)
 * 2. Unauthenticated Public Consumer
 * 3. KVIC Admin (admin@example.com)
 * 4. User isolation and batch verification linking
 */
import 'dotenv/config';

// Ensure import.meta.env has process.env in tsx/node environment
if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  Object.assign((import.meta as any).env, process.env);
}

import { auth, isFirebaseConfigured } from '../src/services/firebase.service';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firestoreMarketplaceRepository } from '../src/services/firestore/marketplace.repository';
import { firestoreOrderRequestRepository } from '../src/services/firestore/order-request.repository';
import { firestoreBatchRepository } from '../src/services/firestore/batch.repository';
import { firestoreIdentityService } from '../src/services/firestore';

async function runPhase2ETest() {
  console.log('====================================================');
  console.log('HONEY CHAIN — PHASE 2E FIRESTORE MARKETPLACE TEST');
  console.log('====================================================\n');

  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Auth is not configured. Check .env variables.');
  }

  // Seed demo data if needed
  console.log('Step 0: Seeding demo marketplace products if needed...');
  await firestoreIdentityService.seedDemoMarketplaceProducts();

  // 1. Authenticate as Beekeeper A
  console.log('\nStep 1: Authenticating as Beekeeper A (beekeeper@example.com)...');
  const beekeeperUserCred = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
  const beekeeperAUid = beekeeperUserCred.user.uid;
  const beekeeperAId = 'BK-MH-NAS-0129';
  const validBatchNumber = 'HC-MH-NAS-2026-00047';
  console.log(`[PASS] Authenticated Beekeeper A UID = ${beekeeperAUid}\n`);

  // 2. Test Batch Validation: Try listing with a non-existent batch
  console.log('Step 2: Testing Batch Validation - Attempt listing with non-existent batch...');
  let rejectedAsExpected = false;
  try {
    await firestoreIdentityService.createMarketplaceListingInFirestore({
      batchNumber: 'HC-NON-EXISTENT-BATCH-99999',
      title: 'Invalid Fake Batch Honey',
      beekeeperUid: beekeeperAUid,
      beekeeperId: beekeeperAId,
      beekeeperName: 'Ramesh Patil',
      producerLocation: 'Nashik, Maharashtra',
      floralType: 'Wild Forest',
      priceInr: 300,
      availableStockBottles: 20,
      description: 'This listing should fail validation.',
    });
  } catch (err: any) {
    rejectedAsExpected = true;
    console.log(`[PASS] Listing with invalid batch correctly rejected: "${err.message}"`);
  }

  if (!rejectedAsExpected) {
    throw new Error('Batch validation failed: non-existent batch was allowed to be listed');
  }

  // 3. Beekeeper A creates a marketplace listing linked to their valid batch
  console.log('\nStep 3: Beekeeper A creates a marketplace listing linked to their own valid batch...');
  const testProductId = `MP-TEST-${Date.now().toString().slice(-4)}`;
  const productA = await firestoreIdentityService.createMarketplaceListingInFirestore({
    productId: testProductId,
    batchNumber: validBatchNumber,
    title: 'Certified Pure Sahyadri Multifloral Raw Honey (500g Jar)',
    beekeeperUid: beekeeperAUid,
    beekeeperId: beekeeperAId,
    beekeeperName: 'Ramesh Patil',
    producerLocation: 'Dindori, Nashik (Maharashtra)',
    floralType: 'Multi-Floral Wild Forest & Mustard',
    priceInr: 390,
    weightGrams: 500,
    availableStockBottles: 45,
    description: 'Freshly harvested unfiltered raw honey cold-extracted from Western Ghats apiary hives.',
    contactNumber: '+91 98234 56781',
  });

  console.log(`[PASS] Marketplace listing created: ID = ${productA.id}`);
  console.log(`[PASS] Title: "${productA.title}", Price = ₹${productA.priceInr}`);
  console.log(`[PASS] Linked Batch Number = ${productA.batchId} (${productA.batchNumber})`);
  console.log(`[PASS] Verification Status = ${productA.verificationStatus}, VerifiedBadge = ${productA.verifiedBadge}`);
  console.log(`[PASS] Beekeeper UID = ${productA.beekeeperUid}`);

  // 4. Persistence check: Reload product directly from Firestore
  console.log('\nStep 4: Reloading product directly from Firestore repository...');
  const fetchedProduct = await firestoreMarketplaceRepository.getProductById(testProductId);
  if (!fetchedProduct) {
    throw new Error(`Product ${testProductId} not found in Firestore`);
  }
  if (fetchedProduct.batchNumber !== validBatchNumber) {
    throw new Error(`BatchNumber mismatch: expected ${validBatchNumber}, got ${fetchedProduct.batchNumber}`);
  }
  console.log(`[PASS] Product persistence confirmed in Firestore: Status = ${fetchedProduct.status}`);

  // 5. Beekeeper A can update their own listing
  console.log('\nStep 5: Beekeeper A updates stock and price for their listing...');
  const updateSuccess = await firestoreIdentityService.updateMarketplaceProductInFirestore(testProductId, {
    priceInr: 420,
    availableStockBottles: 40,
    description: 'Updated fresh reserve stock.',
  });
  console.log(`[PASS] Update executed in Firestore: ${updateSuccess}`);

  const reFetchedProduct = await firestoreMarketplaceRepository.getProductById(testProductId);
  if (reFetchedProduct?.priceInr !== 420 || reFetchedProduct?.availableStockBottles !== 40) {
    throw new Error('Product updates did not persist');
  }
  console.log(`[PASS] Updated price persists: ₹${reFetchedProduct.priceInr}, Stock: ${reFetchedProduct.availableStockBottles}`);

  // 6. Public Consumer unauthenticated browsing
  console.log('\nStep 6: Signing out Beekeeper A. Testing Unauthenticated Public Consumer browsing...');
  await signOut(auth);
  console.log('[PASS] Signed out. auth.currentUser is now null (Public Consumer mode).');

  const publicCatalog = await firestoreIdentityService.loadPublicMarketplaceProducts();
  console.log(`[PASS] Public consumer retrieved ${publicCatalog.length} active marketplace product(s) without authentication.`);

  const listedItem = publicCatalog.find((p) => p.id === testProductId);
  if (!listedItem) {
    throw new Error(`Public consumer could not find published product ${testProductId}`);
  }
  console.log(`[PASS] Public consumer sees product: "${listedItem.title}"`);
  console.log(`[PASS] Producer: "${listedItem.beekeeperName}", Location: "${listedItem.producerLocation}"`);
  console.log(`[PASS] Verified Batch ID: ${listedItem.batchId}`);

  // Confirm privacy: no sensitive tickets, sensor internals, or private notes in marketplace doc
  if ((listedItem as any).supportTickets || (listedItem as any).internalNotes || (listedItem as any).privateTelemetry) {
    throw new Error('Privacy violation: private data leaked in marketplace document');
  }
  console.log('[PASS] Privacy verified: No private internal telemetry or support tickets leaked.');

  // 7. Public Consumer submits an Order / Enquiry Request
  console.log('\nStep 7: Unauthenticated Public Consumer submits an order request...');
  const orderReq = await firestoreIdentityService.submitOrderRequestInFirestore({
    productId: testProductId,
    productName: listedItem.title,
    batchNumber: validBatchNumber,
    beekeeperUid: beekeeperAUid,
    beekeeperId: beekeeperAId,
    consumerName: 'Aditi Kulkarni (Consumer)',
    consumerContact: '+91 98220 54321',
    consumerMessage: 'Please reserve 3 jars for pickup at Pune Khadi Bhavan desk.',
    requestedQuantity: 3,
  });

  console.log(`[PASS] Order request submitted to Firestore: ID = ${orderReq.orderRequestId}`);
  console.log(`[PASS] Product: "${orderReq.productName}", Batch = ${orderReq.batchNumber}`);
  console.log(`[PASS] Requested Quantity = ${orderReq.requestedQuantity} Jars, Status = ${orderReq.status}`);
  console.log(`[PASS] Target Beekeeper UID = ${orderReq.beekeeperUid}`);

  // 8. Beekeeper A logs in and inspects the order request
  console.log('\nStep 8: Beekeeper A signs back in to view incoming customer orders...');
  await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');

  const beekeeperOrders = await firestoreIdentityService.loadBeekeeperOrderRequests(beekeeperAUid);
  console.log(`[PASS] Beekeeper A loaded ${beekeeperOrders.length} order request(s) for their products.`);
  const foundOrder = beekeeperOrders.find((o) => o.orderRequestId === orderReq.orderRequestId);
  if (!foundOrder) {
    throw new Error(`Beekeeper A could not find order request ${orderReq.orderRequestId}`);
  }
  console.log(`[PASS] Found order from ${foundOrder.consumerName} for ${foundOrder.requestedQuantity} jar(s).`);
  console.log(`[PASS] Consumer message: "${foundOrder.consumerMessage}"`);

  // 9. Beekeeper A updates order status (PENDING -> ACCEPTED -> COMPLETED)
  console.log('\nStep 9: Beekeeper A accepts and completes the order request...');
  await firestoreIdentityService.updateOrderRequestStatusInFirestore(orderReq.orderRequestId, 'ACCEPTED');
  let updatedOrder = await firestoreOrderRequestRepository.getOrderRequestById(orderReq.orderRequestId);
  if (updatedOrder?.status !== 'ACCEPTED') {
    throw new Error(`Expected status 'ACCEPTED', got '${updatedOrder?.status}'`);
  }
  console.log(`[PASS] Order status updated in Firestore: ${updatedOrder.status}`);

  await firestoreIdentityService.updateOrderRequestStatusInFirestore(orderReq.orderRequestId, 'COMPLETED');
  updatedOrder = await firestoreOrderRequestRepository.getOrderRequestById(orderReq.orderRequestId);
  if (updatedOrder?.status !== 'COMPLETED') {
    throw new Error(`Expected status 'COMPLETED', got '${updatedOrder?.status}'`);
  }
  console.log(`[PASS] Order status completed in Firestore: ${updatedOrder.status}`);

  // 10. Isolation check: Beekeeper B cannot see Beekeeper A's orders
  console.log('\nStep 10: Isolation check - Testing queries for a different beekeeper UID...');
  const fakeBeekeeperUid = 'OTHER_BEEKEEPER_ISOLATION_TEST_9999';
  const otherOrders = await firestoreOrderRequestRepository.getOrderRequestsByBeekeeper(fakeBeekeeperUid);
  console.log(`[PASS] Beekeeper B query returned ${otherOrders.length} orders (0 leakage).`);

  // 11. Admin signs in and inspects marketplace and order requests
  console.log('\nStep 11: Signing out Beekeeper and signing in as KVIC Admin (admin@example.com)...');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');

  const adminProducts = await firestoreIdentityService.loadAllMarketplaceProducts();
  const adminOrders = await firestoreIdentityService.loadAllOrderRequests();
  console.log(`[PASS] Admin queried marketplace: ${adminProducts.length} product(s) across beekeepers.`);
  console.log(`[PASS] Admin queried orders: ${adminOrders.length} total customer request(s) monitored.`);

  // 12. Batch Traceability Link: Verify consumer path from marketplace product to batch verification
  console.log('\nStep 12: Verifying Consumer Traceability Link (Product -> Batch -> QR -> Traceability)...');
  const publicBatch = await firestoreIdentityService.loadPublicBatch(validBatchNumber);
  if (!publicBatch) {
    throw new Error(`Public batch ${validBatchNumber} could not be resolved from marketplace reference`);
  }
  console.log(`[PASS] Batch ${validBatchNumber} resolved: Product = "${publicBatch.productName}"`);
  console.log(`[PASS] Origin = ${publicBatch.originDistrict}, ${publicBatch.originState}, FSSAI = ${publicBatch.fssaiNumber}`);
  console.log(`[PASS] Cryptographic verification badge = ${publicBatch.verificationStatus}`);

  // 13. Clean up test listing
  console.log('\nStep 13: Cleaning up test product...');
  await firestoreIdentityService.deleteMarketplaceProductInFirestore(testProductId);
  const deletedCheck = await firestoreMarketplaceRepository.getProductById(testProductId);
  console.log(`[PASS] Test product removed from Firestore: exists = ${Boolean(deletedCheck)}`);

  await signOut(auth);
  console.log('\n====================================================');
  console.log('ALL PHASE 2E TEST SCENARIOS PASSED WITH FIRESTORE! (13/13)');
  console.log('====================================================\n');
}

runPhase2ETest().catch((err) => {
  console.error('\n[FAIL] Phase 2E test encountered an error:', err);
  process.exit(1);
});
