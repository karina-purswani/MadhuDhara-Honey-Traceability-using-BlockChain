import 'dotenv/config';
import { auth, db } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firestoreIdentityService } from '../src/services/firestore/index';

async function testWithLogin() {
  if (auth && !auth.currentUser) {
    console.log('Signing in as admin...');
    await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
    const user = auth.currentUser as any;
    console.log('Signed in. Current user:', user?.email);
  }

  const stats = await firestoreIdentityService.getAdminSystemStats();
  console.log('Stats after sign-in:', JSON.stringify(stats, null, 2));
}

testWithLogin().catch(console.error);
