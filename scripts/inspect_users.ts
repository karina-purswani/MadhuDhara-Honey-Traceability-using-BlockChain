import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  if (!auth || !db) process.exit(1);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');

  console.log('=== USERS ===');
  const userSnap = await getDocs(collection(db, 'users'));
  userSnap.forEach(d => {
    console.log(`ID: ${d.id} | Name: ${d.data().name} | Email: ${d.data().email} | Role: ${d.data().role}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
