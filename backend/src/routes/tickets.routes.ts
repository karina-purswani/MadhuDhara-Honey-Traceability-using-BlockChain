/**
 * Tickets Module Routes
 * Endpoints for support ticketing, telemetry snapshot triage, and conversation threads.
 */

import { Router, Request, Response } from 'express';
import { ApiResponseUtil } from '../utils/apiResponse';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { TicketsController } from '../controllers/tickets.controller';

const router = Router();

/**
 * GET /api/tickets/status
 * Status check for Ticket endpoints
 */
router.get('/status', (_req: Request, res: Response) => {
  ApiResponseUtil.success(
    res,
    {
      module: 'tickets',
      phase: '3D',
      status: 'active',
      description: 'Support desk and ticketing routes active',
    },
    'Tickets API ready'
  );
});

/**
 * GET /api/tickets
 * Returns support tickets (beekeeper's own or all for KVIC_ADMIN).
 */
router.get('/', requireAuth, TicketsController.getTickets);

/**
 * POST /api/tickets
 * Creates a new support ticket.
 */
router.post(
  '/',
  requireAuth,
  requireRole('BEEKEEPER', 'KVIC_ADMIN'),
  TicketsController.createTicket
);

/**
 * GET /api/tickets/:ticketId/messages
 * Retrieves conversation messages for a ticket with participant privacy check.
 */
router.get('/:ticketId/messages', requireAuth, TicketsController.getTicketMessages);

/**
 * POST /api/tickets/:ticketId/messages
 * Appends a message to a ticket thread.
 */
router.post('/:ticketId/messages', requireAuth, TicketsController.addTicketMessage);

/**
 * PATCH /api/tickets/:ticketId/status
 * Updates ticket resolution status.
 */
router.patch('/:ticketId/status', requireAuth, TicketsController.updateTicketStatus);

/**
 * GET /api/tickets/:ticketId
 * Retrieves ticket details.
 */
router.get('/:ticketId', requireAuth, TicketsController.getTicketById);

export const ticketRoutes = router;
