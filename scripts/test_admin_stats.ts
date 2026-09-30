import 'dotenv/config';
import { auth } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';

async function test() {
  if (!auth) {
    console.log('No auth');
    return;
  }
  const cred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  const token = await cred.user.getIdToken();
  console.log('Admin token obtained, length:', token.length);

  for (const host of ['127.0.0.1', 'localhost']) {
    try {
      console.log(`\nTesting http://${host}:5000/api/health:`);
      const resHealth = await fetch(`http://${host}:5000/api/health`);
      console.log(`Status:`, resHealth.status, await resHealth.json());

      console.log(`Testing http://${host}:5000/api/admin/stats:`);
      const resStats = await fetch(`http://${host}:5000/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(`Stats Status:`, resStats.status);
      const data = await resStats.json();
      console.log(`Stats Data:`, JSON.stringify(data, null, 2));
    } catch (e: any) {
      console.error(`Error with ${host}:`, e.message);
    }
  }
}

test().catch(console.error);
