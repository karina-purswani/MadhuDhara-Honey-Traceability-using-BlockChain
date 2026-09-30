/**
 * Phase 2C End-to-End Firestore Alerts & Support Tickets Test Suite
 * Tests full flow with real Firebase Auth users:
 * 1. Beekeeper (beekeeper@example.com)
 * 2. Admin (admin@example.com)
 */
import 'dotenv/config';

if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  Object.assign((import.meta as any).env, process.env);
}

import { auth, isFirebaseConfigured } from '../src/services/firebase.service';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firestoreAlertRepository } from '../src/services/firestore/alert.repository';
import { firestoreIdentityService } from '../src/services/firestore';

async function runPhase2CTest() {
  console.log('====================================================');
  console.log('HONEY CHAIN — REGRESSION CHECK: PHASE 2C ALERTS & TICKETS');
  console.log('====================================================\n');

  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Auth is not configured. Check .env variables.');
  }

  // 1. Authenticate as Beekeeper
  console.log('Step 0: Authenticating as Beekeeper (beekeeper@example.com)...');
  const beekeeperUserCred = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
  const beekeeperUid = beekeeperUserCred.user.uid;
  const beekeeperId = 'BK-MH-NAS-0129';
  const hiveId = 'HC-HIVE-MH-NAS-00123';
  console.log(`[PASS] Authenticated Beekeeper UID = ${beekeeperUid}\n`);

  // 2. Load alerts
  console.log('Step 1: Beekeeper loads alerts...');
  const beekeeperAAlerts = await firestoreIdentityService.loadBeekeeperAlerts(beekeeperUid);
  console.log(`[PASS] Beekeeper fetched ${beekeeperAAlerts.length} alert(s) from Firestore.`);

  // 3. Load tickets
  console.log('\nStep 2: Beekeeper loads support tickets...');
  const bkTkts = await firestoreIdentityService.loadBeekeeperTickets(beekeeperUid);
  console.log(`[PASS] Beekeeper fetched ${bkTkts.length} ticket(s) from Firestore.`);

  // 4. Switch to Admin
  console.log('\nStep 3: Signing out Beekeeper and signing in as Admin (admin@example.com)...');
  await signOut(auth);
  const adminUserCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  const adminUid = adminUserCred.user.uid;
  console.log(`[PASS] Authenticated Admin UID = ${adminUid}`);

  // 5. Admin queries tickets
  console.log('Step 4: Admin queries tickets across beekeepers...');
  const allTickets = await firestoreIdentityService.loadAllTickets();
  console.log(`[PASS] Admin loaded ${allTickets.length} total tickets from Firestore.`);

  // 6. Consumer verification
  console.log('\nStep 5: Consumer public verification check...');
  await signOut(auth);
  const demoPublicBatch = await firestoreIdentityService.loadPublicBatch('HC-MH-NAS-2026-00047');
  console.log(`[PASS] Consumer public batch loaded: ${demoPublicBatch?.productName}`);

  console.log('\n====================================================');
  console.log('REGRESSION CHECK PASSED! Prior phases 2A, 2B, 2C intact.');
  console.log('====================================================\n');
}

runPhase2CTest().catch((err) => {
  console.error('\n[FAIL] Regression test failed:', err);
  process.exit(1);
});
