import 'dotenv/config';
import { adminFirestore, hasAdminCredentials } from '../backend/src/config/firebase-admin.config';

async function testDirect() {
  console.log('hasAdminCredentials:', hasAdminCredentials);
  try {
    const snap = await adminFirestore.collection('beekeepers').count().get();
    console.log('Admin count success:', snap.data().count);
  } catch (err: any) {
    console.error('Admin count error:', err?.message || err);
  }
}

testDirect().catch(console.error);
