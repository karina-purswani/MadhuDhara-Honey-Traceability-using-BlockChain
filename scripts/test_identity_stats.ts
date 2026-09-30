import 'dotenv/config';
import { firestoreIdentityService } from '../src/services/firestore/index';

async function test() {
  const stats = await firestoreIdentityService.getAdminSystemStats();
  console.log('firestoreIdentityService.getAdminSystemStats():', JSON.stringify(stats, null, 2));
}

test().catch(console.error);
