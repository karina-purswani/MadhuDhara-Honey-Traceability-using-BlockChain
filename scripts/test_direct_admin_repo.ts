import 'dotenv/config';
import { adminRepository } from '../backend/src/repositories/admin.repository';

async function test() {
  console.log('Testing adminRepository.getSystemStats directly:');
  const stats = await adminRepository.getSystemStats();
  console.log('Result:', JSON.stringify(stats, null, 2));
}

test().catch(console.error);
