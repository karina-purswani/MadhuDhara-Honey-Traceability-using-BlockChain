import 'dotenv/config';
import { auth } from '../src/services/firebase.service';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firestoreTicketRepository } from '../src/services/firestore/ticket.repository';

async function main() {
  if (auth && !auth.currentUser) {
    await signInWithEmailAndPassword(auth, 'admin@example.com', 'admin123');
  }
  const tickets = await firestoreTicketRepository.getAllTickets();
  console.log('Tickets count:', tickets.length);
  for (const t of tickets) {
    console.log(`Ticket ${t.id}: status="${t.status}", title="${t.title}"`);
  }
}

main().catch(console.error);
