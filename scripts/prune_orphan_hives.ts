/**
 * Prune Orphan Hives and Apiaries
 * Removes hives and apiaries in Firestore that belong to deleted/non-existent beekeepers.
 */
import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';

async function pruneOrphans() {
  if (!auth || !db) {
    console.error('Firebase not initialized');
    process.exit(1);
  }

  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  console.log('Logged in as admin.');

  // 1. Get active beekeeper IDs
  const beekeeperSnap = await getDocs(collection(db, 'beekeepers'));
  const activeBeekeeperIds = new Set<string>();
  beekeeperSnap.forEach((d) => {
    const data = d.data();
    if (data.beekeeperId) activeBeekeeperIds.add(data.beekeeperId);
    if (data.firebaseUid) activeBeekeeperIds.add(data.firebaseUid);
    activeBeekeeperIds.add(d.id);
  });

  console.log('Active Beekeeper IDs in Firestore:', Array.from(activeBeekeeperIds));

  // 2. Scan and prune orphan Apiaries
  const apiarySnap = await getDocs(collection(db, 'apiaries'));
  let deletedApiaries = 0;
  for (const d of apiarySnap.docs) {
    const data = d.data();
    const bkId = data.beekeeperId || data.beekeeperUid;
    if (!activeBeekeeperIds.has(bkId)) {
      console.log(`Deleting orphan apiary: ${d.id} (beekeeper: ${bkId})`);
      await deleteDoc(doc(db, 'apiaries', d.id));
      deletedApiaries++;
    }
  }

  // 3. Scan and prune orphan Hives
  const hiveSnap = await getDocs(collection(db, 'hives'));
  let deletedHives = 0;
  for (const d of hiveSnap.docs) {
    const data = d.data();
    const bkId = data.beekeeperId || data.beekeeperUid;
    if (!activeBeekeeperIds.has(bkId)) {
      console.log(`Deleting orphan hive: ${d.id} (beekeeper: ${bkId})`);
      await deleteDoc(doc(db, 'hives', d.id));
      deletedHives++;
    }
  }

  console.log(`\nPrune complete: Deleted ${deletedApiaries} orphan apiary(ies) and ${deletedHives} orphan hive(s).`);
  process.exit(0);
}

pruneOrphans().catch((err) => {
  console.error('Prune failed:', err);
  process.exit(1);
});
