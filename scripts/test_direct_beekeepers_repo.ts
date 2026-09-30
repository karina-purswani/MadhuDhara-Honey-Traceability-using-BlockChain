import 'dotenv/config';
import { beekeepersRepository } from '../backend/src/repositories/beekeepers.repository';

async function test() {
  console.log('Testing beekeepersRepository.getLightweightBeekeepers directly:');
  const bks = await beekeepersRepository.getLightweightBeekeepers();
  console.log('Count:', bks.length);
  console.log('Beekeepers:', JSON.stringify(bks, null, 2));
}

test().catch(console.error);
