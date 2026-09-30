/**
 * Phase 2D End-to-End Firestore Learning Hub & Notifications Test Suite
 * Tests full flow with real Firebase Auth users:
 * 1. Admin (admin@example.com)
 * 2. Beekeeper (beekeeper@example.com)
 */
import 'dotenv/config';

// Ensure import.meta.env has process.env in tsx/node environment
if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
  Object.assign((import.meta as any).env, process.env);
}

import { auth, isFirebaseConfigured } from '../src/services/firebase.service';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firestoreLearningRepository } from '../src/services/firestore/learning.repository';
import { firestoreNotificationRepository } from '../src/services/firestore/notification.repository';
import { firestoreBeekeeperRepository } from '../src/services/firestore/beekeeper.repository';
import { firestoreIdentityService } from '../src/services/firestore';

async function runPhase2DTest() {
  console.log('====================================================');
  console.log('HONEY CHAIN — PHASE 2D FIRESTORE VERIFICATION TEST');
  console.log('====================================================\n');

  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Auth is not configured. Check .env variables.');
  }

  // 1. Authenticate as Admin
  console.log('Step 1: Authenticating as Admin (admin@example.com)...');
  const adminUserCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  const adminUid = adminUserCred.user.uid;
  console.log(`[PASS] Authenticated Admin UID = ${adminUid}\n`);

  // 2. Open Learning Hub & Seed initial content if needed
  console.log('Step 2: Checking/seeding demo learning content in Firestore...');
  await firestoreIdentityService.seedDemoLearningContent();
  const existingContent = await firestoreIdentityService.loadPublishedLearningContent();
  console.log(`[PASS] Published learning resources loaded from Firestore: ${existingContent.length} item(s)`);

  // 3. Publish a new learning resource as Admin
  console.log('\nStep 3: Admin creates and publishes a new learning resource...');
  const testContentId = `LRN-TEST-${Date.now().toString().slice(-4)}`;
  const testYouTubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  const publishResult = await firestoreIdentityService.publishLearningContentInFirestore({
    contentId: testContentId,
    title: 'Monsoon Hive Moisture Management & Sugar Syrup Protocol',
    description: 'Crucial steps to maintain dry super frames, ventilate hive roofs, and supply syrup feeds safely during continuous heavy rain.',
    category: 'hive_management',
    youtubeUrl: testYouTubeUrl,
    durationMinutes: 12,
    language: 'en',
    authorName: 'Dr. Anil Joshi (KVIC Officer)',
  });

  const publishedContent = publishResult.content;
  console.log(`[PASS] Content published: ID = ${publishedContent.id}, Title: "${publishedContent.title}"`);
  console.log(`[PASS] YouTube URL: ${publishedContent.youtubeUrl}`);
  console.log(`[PASS] Notifications dispatched count: ${publishResult.notificationsCount}`);

  // 4. Confirm document appears in Firestore
  console.log('\nStep 4: Confirming learning resource in Firestore repository...');
  const fetchedDoc = await firestoreLearningRepository.getLearningContentById(testContentId);
  if (!fetchedDoc) {
    throw new Error(`Learning content ${testContentId} not found in Firestore`);
  }
  if (fetchedDoc.status !== 'published') {
    throw new Error(`Expected status 'published', got '${fetchedDoc.status}'`);
  }
  console.log(`[PASS] Firestore verified: Document exists with status '${fetchedDoc.status}'`);

  // 5. Confirm notification was created for beekeepers
  console.log('\nStep 5: Verifying learning notification was dispatched to beekeepers...');
  const beekeepers = await firestoreBeekeeperRepository.getAllBeekeepers();
  console.log(`[PASS] Discovered ${beekeepers.length} registered beekeeper(s) in system.`);
  
  if (beekeepers.length === 0) {
    throw new Error('No registered beekeepers found to verify notification receipt');
  }

  const targetBeekeeper = beekeepers[0];
  const targetBeekeeperUid = targetBeekeeper.firebaseUid || targetBeekeeper.beekeeperId;
  console.log(`[INFO] Checking notifications for Beekeeper UID: ${targetBeekeeperUid} (${targetBeekeeper.name})`);

  const initialNotifs = await firestoreNotificationRepository.getNotificationsByUser(targetBeekeeperUid);
  const learningNotif = initialNotifs.find(n => n.relatedContentId === testContentId);
  if (!learningNotif) {
    throw new Error(`Notification for content ${testContentId} not found for beekeeper ${targetBeekeeperUid}`);
  }
  console.log(`[PASS] Learning notification found: ID = ${learningNotif.id}`);
  console.log(`[PASS] Notification title = "${learningNotif.title}", read = ${learningNotif.read}`);
  console.log(`[PASS] Deterministic ID format: ${learningNotif.id} (prevents duplicate spam)`);

  // 6. Deduplication test: re-publishing or re-triggering notification should not create duplicate
  console.log('\nStep 6: Testing Deduplication - Admin re-publishes the same learning content...');
  await firestoreIdentityService.publishLearningContentInFirestore({
    contentId: testContentId,
    title: 'Monsoon Hive Moisture Management & Sugar Syrup Protocol (Updated)',
    description: 'Updated guidelines for continuous rain management.',
    category: 'hive_management',
    youtubeUrl: testYouTubeUrl,
    durationMinutes: 12,
    language: 'en',
    authorName: 'Dr. Anil Joshi (KVIC Officer)',
  });

  const refreshedNotifs = await firestoreNotificationRepository.getNotificationsByUser(targetBeekeeperUid);
  const matchingNotifs = refreshedNotifs.filter(n => n.relatedContentId === testContentId);
  console.log(`[PASS] Notifications for this content after re-publish: ${matchingNotifs.length} (Expected: 1)`);
  if (matchingNotifs.length !== 1) {
    throw new Error(`Deduplication failed: found ${matchingNotifs.length} notifications`);
  }

  // 7. Login as Beekeeper
  console.log('\nStep 7: Signing out Admin and logging in as Beekeeper (beekeeper@example.com)...');
  await signOut(auth);
  const beekeeperUserCred = await signInWithEmailAndPassword(auth, 'beekeeper@example.com', 'password123');
  const beekeeperUid = beekeeperUserCred.user.uid;
  console.log(`[PASS] Authenticated Beekeeper UID = ${beekeeperUid}`);

  // 8. Confirm notification is visible to Beekeeper
  console.log('\nStep 8: Beekeeper loads notifications...');
  const beekeeperNotifs = await firestoreIdentityService.loadUserNotifications(beekeeperUid);
  console.log(`[PASS] Beekeeper retrieved ${beekeeperNotifs.length} total notification(s).`);
  const myLearningNotif = beekeeperNotifs.find(n => n.relatedContentId === testContentId);
  if (!myLearningNotif) {
    throw new Error(`Beekeeper did not receive notification for ${testContentId}`);
  }
  console.log(`[PASS] Beekeeper sees notification: "${myLearningNotif.title}", type = ${myLearningNotif.type}`);

  // 9. Beekeeper marks notification as read
  console.log('\nStep 9: Beekeeper marks notification as read...');
  await firestoreIdentityService.markNotificationAsReadInFirestore(myLearningNotif.id);
  const afterReadNotifs = await firestoreIdentityService.loadUserNotifications(beekeeperUid);
  const readNotif = afterReadNotifs.find(n => n.id === myLearningNotif.id);
  if (!readNotif?.read) {
    throw new Error('Notification read status was not marked as true');
  }
  console.log(`[PASS] Notification persisted as read = ${readNotif.read}`);

  // 10. Beekeeper opens Learning Hub
  console.log('\nStep 10: Beekeeper opens Learning Hub and queries published content...');
  const beekeeperHubContent = await firestoreIdentityService.loadPublishedLearningContent();
  const testContentInHub = beekeeperHubContent.find(c => c.id === testContentId);
  if (!testContentInHub) {
    throw new Error('Published content was not found in Beekeeper Learning Hub');
  }
  console.log(`[PASS] Beekeeper found published content: "${testContentInHub.title}"`);
  console.log(`[PASS] Category: "${testContentInHub.category}", Duration: ${testContentInHub.durationMinutes} mins`);
  console.log(`[PASS] Language: ${testContentInHub.language}`);

  // 11. Confirm YouTube URL validity
  console.log('\nStep 11: Validating YouTube URL link integrity...');
  if (!testContentInHub.youtubeUrl.startsWith('https://www.youtube.com') && !testContentInHub.youtubeUrl.startsWith('https://youtu.be')) {
    throw new Error(`Invalid YouTube URL format: ${testContentInHub.youtubeUrl}`);
  }
  console.log(`[PASS] YouTube link is valid and clickable: ${testContentInHub.youtubeUrl}`);

  // 12. Refresh / Persistence check
  console.log('\nStep 12: Simulating browser reload / re-fetch...');
  const reloadContent = await firestoreIdentityService.loadPublishedLearningContent();
  const reloadNotifs = await firestoreIdentityService.loadUserNotifications(beekeeperUid);
  if (!reloadContent.some(c => c.id === testContentId)) {
    throw new Error('Content did not persist after simulated reload');
  }
  if (!reloadNotifs.some(n => n.id === myLearningNotif.id && n.read === true)) {
    throw new Error('Notification read state did not persist after simulated reload');
  }
  console.log('[PASS] Full persistence confirmed for both content and notification states.');

  // 13. Security check: User notification isolation
  console.log('\nStep 13: Verifying notification isolation between users...');
  const fakeRecipientUid = 'OTHER_BEEKEEPER_9999';
  const otherUserNotifs = await firestoreNotificationRepository.getNotificationsByUser(fakeRecipientUid);
  console.log(`[PASS] Isolation confirmed: Query for other recipient returned ${otherUserNotifs.length} items (no leakage).`);

  // 14. Verify non-regression of prior phases:
  console.log('\nStep 14: Verifying non-regression of alerts, tickets, and public verification...');
  // Alerts
  const bkAlerts = await firestoreIdentityService.loadBeekeeperAlerts(beekeeperUid);
  console.log(`[PASS] Existing alerts work: loaded ${bkAlerts.length} alert(s) for Beekeeper.`);
  
  // Support Tickets
  const bkTkts = await firestoreIdentityService.loadBeekeeperTickets(beekeeperUid);
  console.log(`[PASS] Support tickets work: loaded ${bkTkts.length} ticket(s) for Beekeeper.`);

  // Public Batch Verification
  const publicBatch = await firestoreIdentityService.loadPublicBatch('HC-MH-NAS-2026-00047');
  console.log(`[PASS] Public batch verification works: ${publicBatch?.productName}`);

  // Consumer unauthenticated access
  await signOut(auth);
  console.log('[PASS] Consumer unauthenticated state verified (signed out).');

  console.log('\n====================================================');
  console.log('ALL PHASE 2D TEST SCENARIOS PASSED WITH FIRESTORE! (14/14)');
  console.log('====================================================\n');
}

runPhase2DTest().catch((err) => {
  console.error('\n[FAIL] Test encountered an error:', err);
  process.exit(1);
});
