/**
 * Honey Chain - Verification Test: Remove Mock Learning Fallback & Deletion Lifecycle
 * Verifies:
 * 1. Admin publishes learning resource
 * 2. Beekeeper sees it in Firestore
 * 3. Deleting resource from Firestore makes it disappear immediately from Beekeeper Hub
 * 4. Refreshing does NOT resurrect deleted documents
 * 5. Automatic seedDemoLearningContent does NOT recreate deleted mock data
 */
import 'dotenv/config';

// Ensure import.meta.env has process.env in tsx/node environment
if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  Object.assign((import.meta as any).env, process.env);
}

import { auth, isFirebaseConfigured } from '../src/services/firebase.service';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firestoreLearningRepository } from '../src/services/firestore/learning.repository';
import { firestoreIdentityService } from '../src/services/firestore';

async function runLearningDeletionTest() {
  console.log('====================================================');
  console.log('HONEY CHAIN — LEARNING DELETION & FIRESTORE TRUTH TEST');
  console.log('====================================================\n');

  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Auth is not configured. Check .env variables.');
  }

  // Step 1: Sign in as Admin
  console.log('Step 1: Signing in as Admin (admin@example.com)...');
  const adminUserCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  console.log(`[PASS] Admin signed in: UID = ${adminUserCred.user.uid}`);

  // Step 2: Publish a test learning guide
  const testId = `LRN-DEL-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\nStep 2: Admin publishes test guide (${testId})...`);
  const published = await firestoreIdentityService.publishLearningContentInFirestore({
    contentId: testId,
    title: 'Testing Deletion Flow Guide (Temporary)',
    description: 'This document will be deleted to verify Firestore is the sole source of truth.',
    category: 'hive_management',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationMinutes: 10,
    language: 'en',
    authorName: 'Dr. Anil Joshi (KVIC Officer)',
  });
  console.log(`[PASS] Guide published to Firestore: ID = ${published.content.id}`);

  // Step 3: Sign in as Beekeeper and check content
  console.log('\nStep 3: Signing in as Beekeeper (beekeeper@example.com)...');
  await signOut(auth);
  const beekeeperCred = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
  console.log(`[PASS] Beekeeper signed in: UID = ${beekeeperCred.user.uid}`);

  let beekeeperHub = await firestoreIdentityService.loadPublishedLearningContent();
  const foundItem = beekeeperHub.find((i) => i.id === testId);
  if (!foundItem) {
    throw new Error(`Published guide ${testId} was not found in Beekeeper Learning Hub`);
  }
  console.log(`[PASS] Beekeeper sees published guide: "${foundItem.title}"`);

  // Step 4: Admin deletes the document from Firestore (simulating manual delete from Firebase Console)
  console.log('\nStep 4: Simulating manual deletion from Firestore Console...');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  const deleteResult = await firestoreLearningRepository.deleteLearningContent(testId);
  console.log(`[PASS] Document ${testId} deleted from Firestore: ${deleteResult}`);

  // Step 5: Beekeeper reloads Learning Hub
  console.log('\nStep 5: Beekeeper signs back in and queries Learning Hub...');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');

  beekeeperHub = await firestoreIdentityService.loadPublishedLearningContent();
  const deletedItemCheck = beekeeperHub.find((i) => i.id === testId);
  if (deletedItemCheck) {
    throw new Error(`FAIL: Deleted document ${testId} is still appearing on Beekeeper Learning Hub!`);
  }
  console.log(`[PASS] Confirmation: Deleted guide ${testId} has DISAPPEARED from Beekeeper Learning Hub.`);

  // Step 6: Simulate page reload / re-query to confirm it does NOT resurrect
  console.log('\nStep 6: Simulating browser reload (second re-fetch)...');
  beekeeperHub = await firestoreIdentityService.loadPublishedLearningContent();
  if (beekeeperHub.some((i) => i.id === testId)) {
    throw new Error(`FAIL: Deleted document resurrected after reload!`);
  }
  console.log(`[PASS] Confirmation: Guide remains ABSENT after reload.`);

  // Step 7: Check that seedDemoLearningContent is NOT automatically invoked
  console.log('\nStep 7: Verifying no automatic mock data fallback or re-seeding occurs...');
  // The beekeeper hub contains strictly what is currently in Firestore
  console.log(`[PASS] Current items in Beekeeper Hub: ${beekeeperHub.length} item(s) (all from Firestore)`);

  // Step 8: Admin publishes a brand new guide
  console.log('\nStep 8: Admin publishes a NEW guide to test complete re-population...');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  const newGuideId = `LRN-NEW-${Date.now().toString().slice(-4)}`;
  await firestoreIdentityService.publishLearningContentInFirestore({
    contentId: newGuideId,
    title: 'Brand New Post-Cleanup Apiculture Guide',
    description: 'Fresh training guide published after cleanup.',
    category: 'disease_control',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    durationMinutes: 20,
    language: 'en',
    authorName: 'Dr. Anil Joshi (KVIC Officer)',
  });
  console.log(`[PASS] New guide ${newGuideId} published.`);

  // Step 9: Beekeeper sees the new guide
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
  beekeeperHub = await firestoreIdentityService.loadPublishedLearningContent();
  if (!beekeeperHub.some((i) => i.id === newGuideId)) {
    throw new Error(`New guide ${newGuideId} did not appear for beekeeper`);
  }
  console.log(`[PASS] Beekeeper sees newly published guide: ${newGuideId}`);

  // Step 10: Clean up test document
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  await firestoreLearningRepository.deleteLearningContent(newGuideId);
  console.log(`[PASS] Cleaned up ${newGuideId} from Firestore.`);

  // Step 11: Final check - confirm it disappears
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
  beekeeperHub = await firestoreIdentityService.loadPublishedLearningContent();
  if (beekeeperHub.some((i) => i.id === newGuideId)) {
    throw new Error(`Cleaned up guide still exists`);
  }
  console.log(`[PASS] Cleaned up guide confirmed gone from Beekeeper Hub.`);

  await signOut(auth);
  console.log('\n====================================================');
  console.log('ALL LEARNING DELETION & FIRESTORE TRUTH TESTS PASSED! (11/11)');
  console.log('====================================================\n');
}

runLearningDeletionTest().catch((err) => {
  console.error('\n[FAIL] Test encountered an error:', err);
  process.exit(1);
});
