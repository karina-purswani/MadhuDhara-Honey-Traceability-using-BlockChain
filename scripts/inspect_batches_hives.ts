import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  if (!auth || !db) process.exit(1);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');

  console.log('=== BATCHES ===');
  const bSnap = await getDocs(collection(db, 'batches'));
  bSnap.forEach(d => console.log(d.id, d.data().hiveId, d.data().sourceHiveId, d.data().beekeeperId));

  console.log('=== HARVESTS ===');
  const hSnap = await getDocs(collection(db, 'harvests'));
  hSnap.forEach(d => console.log(d.id, d.data().hiveId, d.data().beekeeperId));

  process.exit(0);
}

main().catch(console.error);
