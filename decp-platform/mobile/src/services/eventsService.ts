import { api } from './api';
import { Event, PaginatedResponse, PaginationParams } from '../types';
import { extractData, mapUser, toPaginated } from './utils';

const mapEvent = (raw: any): Event => {
  const id = raw?._id || raw?.id || '';
  const rsvps = Array.isArray(raw?.rsvps) ? raw.rsvps : [];
  const attendees = Array.isArray(raw?.attendees)
    ? raw.attendees
    : rsvps
        .filter((item: any) => item?.status === 'going')
        .map((item: any) => item?.userId)
        .filter(Boolean);
  const isVirtual = Boolean(raw?.isVirtual || raw?.isOnline);
  const organizerRaw = raw?.organizer && typeof raw.organizer === 'object'
    ? raw.organizer
    : { id: raw?.organizerId || '', firstName: 'Organizer' };

  return {
    id,
    title: raw?.title || '',
    description: raw?.description || '',
    type: raw?.type || 'other',
    location: {
      type: isVirtual ? 'virtual' : 'physical',
      address: isVirtual ? undefined : raw?.location || '',
      link: raw?.meetingLink || undefined,
    },
    startDate: raw?.startDate || new Date().toISOString(),
    endDate: raw?.endDate || raw?.startDate || new Date().toISOString(),
    organizer: mapUser(organizerRaw),
    attendees,
    maxAttendees: raw?.capacity || raw?.maxAttendees,
    banner: raw?.banner || raw?.imageUrl,
    isAttending: false,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
  };
};

export const eventsService = {
  getEvents: async (params: PaginationParams & { filters?: any } = {}): Promise<PaginatedResponse<Event>> => {
    const { page = 1, limit = 10, filters = {} } = params;
    const response = await api.get('/events', {
      params: { page, limit, ...filters },
    });
    return toPaginated<Event>(response, mapEvent);
  },

  getEventById: async (eventId: string): Promise<Event> => {
    const response = await api.get(`/events/${eventId}`);
    const data = extractData<any>(response);
    return mapEvent(data.event || data);
  },

  createEvent: async (eventData: Partial<Event>): Promise<Event> => {
    const response = await api.post('/events', eventData);
    const data = extractData<any>(response);
    return mapEvent(data.event || data);
  },

  updateEvent: async (eventId: string, data: Partial<Event>): Promise<Event> => {
    const response = await api.put(`/events/${eventId}`, data);
    const payload = extractData<any>(response);
    return mapEvent(payload.event || payload);
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await api.delete(`/events/${eventId}`);
  },

  attendEvent: async (eventId: string): Promise<{ attendees: string[] }> => {
    const response = await api.post(`/events/${eventId}/rsvp`, { status: 'going' });
    const data = extractData<any>(response);
    const attendeeId = data?.rsvp?.userId;
    return { attendees: attendeeId ? [attendeeId] : [] };
  },

  cancelAttendance: async (eventId: string): Promise<{ attendees: string[] }> => {
    await api.post(`/events/${eventId}/rsvp`, { status: 'not_going' });
    return { attendees: [] };
  },

  getMyEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events/my-rsvps');
    const data = extractData<any>(response);
    const rsvps = Array.isArray(data?.rsvps) ? data.rsvps : [];
    return rsvps
      .map((item: any) => item?.Event || item?.event)
      .filter(Boolean)
      .map(mapEvent);
  },

  getAttendingEvents: async (): Promise<Event[]> => {
    const response = await api.get('/events/my-rsvps');
    const data = extractData<any>(response);
    const rsvps = Array.isArray(data?.rsvps) ? data.rsvps : [];
    return rsvps
      .filter((item: any) => item?.status === 'going')
      .map((item: any) => item?.Event || item?.event)
      .filter(Boolean)
      .map(mapEvent);
  },

  uploadEventBanner: async (eventId: string, imageUri: string): Promise<{ banner: string }> => {
    await Promise.resolve(eventId);
    return { banner: imageUri };
  },
};
