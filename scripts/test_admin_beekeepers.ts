import 'dotenv/config';
import { auth } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';

async function test() {
  if (!auth) return;
  const cred = await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  const token = await cred.user.getIdToken();

  const res = await fetch('http://localhost:5000/api/beekeepers', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('GET /api/beekeepers status:', res.status);
  const json = await res.json();
  console.log('GET /api/beekeepers data count:', json.data?.length);
  console.log('Sample beekeepers:', json.data);
}

test().catch(console.error);
