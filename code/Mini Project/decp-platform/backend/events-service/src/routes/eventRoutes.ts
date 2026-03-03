import { Router } from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  getMyRSVPs
} from '../controllers/eventController';

const router = Router();

router.get('/', getEvents);
router.post('/', createEvent);
router.get('/my-rsvps', getMyRSVPs);
router.get('/:eventId', getEvent);
router.put('/:eventId', updateEvent);
router.delete('/:eventId', deleteEvent);
router.post('/:eventId/rsvp', rsvpEvent);

export default router;
