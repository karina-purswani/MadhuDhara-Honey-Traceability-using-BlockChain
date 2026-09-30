import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

async function main() {
  if (!auth || !db) process.exit(1);
  await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');

  console.log('=== BEEKEEPERS ===');
  const bkSnap = await getDocs(collection(db, 'beekeepers'));
  bkSnap.forEach(d => {
    console.log(`ID: ${d.id} | Name: ${d.data().name} | BK_ID: ${d.data().beekeeperId} | totalApiaries: ${d.data().totalApiaries} | totalHives: ${d.data().totalHives}`);
  });

  console.log('\n=== APIARIES ===');
  const apSnap = await getDocs(collection(db, 'apiaries'));
  apSnap.forEach(d => {
    console.log(`ID: ${d.id} | Name: ${d.data().name} | BK_ID: ${d.data().beekeeperId} | hiveCount: ${d.data().hiveCount}`);
  });

  console.log('\n=== HIVES ===');
  const hiveSnap = await getDocs(collection(db, 'hives'));
  hiveSnap.forEach(d => {
    console.log(`ID: ${d.id} | Box: ${d.data().boxNumber} | BK_ID: ${d.data().beekeeperId} | Apiary: ${d.data().apiaryId}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
