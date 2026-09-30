import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

async function main() {
  if (!auth || !db) process.exit(1);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');

  const uSnap = await getDoc(doc(db, 'users', 'u1JWgZLj5eMWZSkQqc2O3clVkXw2'));
  console.log('USER DOC:', JSON.stringify(uSnap.data()));

  const bkSnap = await getDoc(doc(db, 'beekeepers', 'u1JWgZLj5eMWZSkQqc2O3clVkXw2'));
  console.log('BK DOC:', JSON.stringify(bkSnap.data()));

  process.exit(0);
}

main().catch(console.error);
