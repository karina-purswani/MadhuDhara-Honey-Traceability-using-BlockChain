import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getCountFromServer, getDocs } from 'firebase/firestore';

async function check() {
  if (!auth || !db) {
    console.log('No auth or db');
    process.exit(1);
  }
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  console.log('Logged in as admin successfully');

  const collections = [
    'beekeepers',
    'apiaries',
    'hives',
    'batches',
    'tickets',
    'learning_content',
    'marketplace_products',
    'order_requests'
  ];

  for (const collName of collections) {
    try {
      const snap = await getCountFromServer(collection(db, collName));
      console.log(`${collName} count:`, snap.data().count);
    } catch (e: any) {
      console.log(`${collName} count error:`, e.message);
      try {
        const docSnap = await getDocs(collection(db, collName));
        console.log(`${collName} fallback getDocs count:`, docSnap.docs.length);
      } catch (err2: any) {
        console.log(`${collName} getDocs also failed:`, err2.message);
      }
    }
  }
  process.exit(0);
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
