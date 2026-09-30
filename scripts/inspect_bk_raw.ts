import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  if (!auth || !db) process.exit(1);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');

  const snap = await getDocs(collection(db, 'beekeepers'));
  snap.forEach(d => {
    console.log(d.id, JSON.stringify(d.data()));
  });

  process.exit(0);
}

main().catch(console.error);
