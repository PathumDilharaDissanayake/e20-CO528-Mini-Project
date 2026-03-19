/**
 * Event Service — Business logic layer for events-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */

import { Event, RSVP } from '../models';

export interface EventInput {
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isVirtual?: boolean;
  meetingLink?: string;
  capacity?: number;
  imageUrl?: string;
  tags?: string[];
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const listEvents = async (type?: string, status = 'published', page = 1, limit = 10) => {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const offset = (page - 1) * safeLimit;
  const where: Record<string, unknown> = { status };
  if (type) where.type = type;

  const { count, rows } = await Event.findAndCountAll({
    where, order: [['startDate', 'ASC']], limit: safeLimit, offset
  });
  return { events: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};

export const getEventById = async (eventId: string): Promise<Event> => {
  const event = await Event.findByPk(eventId, { include: [{ model: RSVP, as: 'rsvps' }] });
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  return event;
};

export const getMyRSVPs = async (userId: string) => {
  return RSVP.findAll({
    where: { userId },
    include: [{ model: Event, as: 'Event' }],
    order: [['createdAt', 'DESC']]
  });
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const createEvent = async (organizerId: string, data: EventInput): Promise<Event> => {
  return Event.create({ ...data, organizerId } as any);
};

export const updateEvent = async (eventId: string, userId: string, data: Partial<EventInput>): Promise<Event> => {
  const event = await Event.findByPk(eventId);
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  if (event.organizerId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  return event.update(data as any);
};

export const deleteEvent = async (eventId: string, userId: string, userRole: string): Promise<void> => {
  const event = await Event.findByPk(eventId);
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });
  if (event.organizerId !== userId && userRole !== 'admin') {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  await event.destroy();
};

export const rsvpEvent = async (
  eventId: string,
  userId: string,
  status: string
): Promise<RSVP> => {
  const event = await Event.findByPk(eventId);
  if (!event) throw Object.assign(new Error('Event not found'), { statusCode: 404 });

  if (event.capacity && status === 'going') {
    const going = await RSVP.count({ where: { eventId, status: 'going' } });
    if (going >= event.capacity) {
      throw Object.assign(new Error('Event is at capacity'), { statusCode: 400 });
    }
  }

  const rsvpStatus = status as 'going' | 'maybe' | 'not_going';
  const [rsvp, created] = await RSVP.findOrCreate({
    where: { eventId, userId },
    defaults: { eventId, userId, status: rsvpStatus }
  });
  if (!created) await rsvp.update({ status: rsvpStatus });
  return rsvp;
};
