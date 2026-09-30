import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function main() {
  console.log('=== RUNNING VERIFICATION SCRIPT ===');

  if (!auth || !db) {
    console.error('Firebase not initialized');
    process.exit(1);
  }

  // 1. Sign in as admin
  console.log('1. Signing in as admin@example.com...');
  const adminCred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  const adminToken = await adminCred.user.getIdToken();
  console.log('Admin signed in successfully.');

  // 2. Test publishing new learning content via backend API
  console.log('2. Publishing new learning material via backend API...');
  const testTitle = `Test Verification Guide ${Date.now()}`;
  const publishRes = await fetch('http://localhost:5000/api/learning', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: testTitle,
      description: 'Test guide for verification of firestore persistence and reload safety',
      category: 'hive_management',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 12,
      language: 'en',
      authorName: 'KVIC Testing Lead',
    }),
  });

  const publishData = await publishRes.json();
  console.log('Publish API Response status:', publishRes.status, 'Item ID:', publishData.data?.id);
  if (publishRes.status !== 201) {
    throw new Error(`Failed to publish learning material: ${JSON.stringify(publishData)}`);
  }
  const publishedId = publishData.data.id;

  // Verify learning content exists directly in Firestore
  const fsLearningDoc = await getDoc(doc(db, 'learning_content', publishedId));
  console.log('Learning doc in Firestore exists?:', fsLearningDoc.exists(), fsLearningDoc.data()?.title);
  if (!fsLearningDoc.exists()) {
    throw new Error('Learning document was NOT stored in Firestore!');
  }

  // Simulate page reload: GET /api/learning
  const getLearningRes = await fetch('http://localhost:5000/api/learning');
  const getLearningData = await getLearningRes.json();
  const foundInReload = getLearningData.data?.some((i: any) => i.id === publishedId);
  console.log('Learning item present after simulated reload?:', foundInReload);
  if (!foundInReload) {
    throw new Error('Learning item vanished on reload!');
  }

  // 3. Inspect Hive before batch creation
  const hivesSnap = await getDocs(collection(db, 'hives'));
  if (hivesSnap.empty) {
    throw new Error('No hives found in Firestore');
  }
  const targetHiveDoc = hivesSnap.docs[0];
  const targetHiveId = targetHiveDoc.id;
  const initialYield = Number(targetHiveDoc.data().lifetimeHoneyYieldKg || 0);
  const initialHarvests = Number(targetHiveDoc.data().totalHarvestsCount || 0);
  console.log(`3. Target Hive (${targetHiveId}) Initial: Yield = ${initialYield} kg, Harvests = ${initialHarvests}`);

  // 4. Sign in as beekeeper
  console.log('4. Signing in as test beekeeper (or admin) to create batch...');
  const batchYield = 16.5;
  const batchRes = await fetch('http://localhost:5000/api/batches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      productName: 'Sahyadri Forest Honey - Verification Batch',
      floralSource: 'Wild Jamun & Mustard',
      quantityKg: batchYield,
      hiveId: targetHiveId,
      beekeeperId: targetHiveDoc.data().beekeeperId || 'BK-MA-NAS-6875',
    }),
  });

  const batchData = await batchRes.json();
  console.log('Batch API Response status:', batchRes.status, 'Batch ID:', batchData.data?.id);
  if (batchRes.status !== 201) {
    throw new Error(`Failed to create batch: ${JSON.stringify(batchData)}`);
  }
  const createdBatchId = batchData.data.id;

  // 5. Verify batch stored in Firestore
  const fsBatchDoc = await getDoc(doc(db, 'batches', createdBatchId));
  console.log('Batch in Firestore exists?:', fsBatchDoc.exists(), fsBatchDoc.data()?.productName);
  if (!fsBatchDoc.exists()) {
    throw new Error('Batch was NOT stored in Firestore!');
  }

  // 6. Verify public batch stored in Firestore
  const fsPublicBatchDoc = await getDoc(doc(db, 'public_batches', createdBatchId));
  console.log('Public batch in Firestore exists?:', fsPublicBatchDoc.exists());
  if (!fsPublicBatchDoc.exists()) {
    throw new Error('Public batch was NOT stored in Firestore!');
  }

  // 7. Verify batch returned in GET /api/batches
  const getBatchesRes = await fetch('http://localhost:5000/api/batches', {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  const getBatchesData = await getBatchesRes.json();
  const batchFound = getBatchesData.data?.some((b: any) => b.id === createdBatchId);
  console.log('Batch present in /api/batches query?:', batchFound);
  if (!batchFound) {
    throw new Error('Batch not found in /api/batches query!');
  }

  // 8. Verify Hive Lifetime Yield and Harvests updated
  const updatedHiveDoc = await getDoc(doc(db, 'hives', targetHiveId));
  const newYield = Number(updatedHiveDoc.data()?.lifetimeHoneyYieldKg || 0);
  const newHarvests = Number(updatedHiveDoc.data()?.totalHarvestsCount || 0);
  console.log(`8. Updated Hive (${targetHiveId}): Yield = ${newYield} kg (Expected: ${Number((initialYield + batchYield).toFixed(1))}), Harvests = ${newHarvests} (Expected: ${initialHarvests + 1})`);

  if (newYield < initialYield + batchYield - 0.01) {
    throw new Error(`Hive Lifetime Yield did NOT update! Expected ${initialYield + batchYield}, got ${newYield}`);
  }
  if (newHarvests !== initialHarvests + 1) {
    throw new Error(`Hive totalHarvestsCount did NOT update! Expected ${initialHarvests + 1}, got ${newHarvests}`);
  }

  console.log('\n ALL 4 ISSUES VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
