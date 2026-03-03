import { apiSlice } from './api';
import { Event, PaginatedResponse, ApiResponse } from '@types';

interface CreateEventData {
  title: string;
  description: string;
  type: 'webinar' | 'workshop' | 'networking' | 'career-fair' | 'seminar';
  startDate: string;
  endDate: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  maxAttendees?: number;
  banner?: string;
}

const normalizeEvent = (raw: any): Event => {
  const eventId = raw?._id || raw?.id || '';
  const attendees = Array.isArray(raw?.attendees)
    ? raw.attendees
    : Array.isArray(raw?.rsvps)
      ? raw.rsvps
          .filter((rsvp: any) => rsvp?.status === 'going')
          .map((rsvp: any) => rsvp?.userId)
          .filter(Boolean)
      : [];

  return {
    _id: eventId,
    id: eventId,
    title: raw?.title || '',
    description: raw?.description || '',
    type: raw?.type || 'seminar',
    startDate: raw?.startDate,
    endDate: raw?.endDate,
    location: raw?.location,
    isOnline: raw?.isOnline ?? raw?.isVirtual ?? false,
    isVirtual: raw?.isVirtual ?? raw?.isOnline ?? false,
    meetingLink: raw?.meetingLink,
    organizerId: raw?.organizerId,
    attendees,
    rsvps: raw?.rsvps,
    maxAttendees: raw?.maxAttendees ?? raw?.capacity,
    capacity: raw?.capacity ?? raw?.maxAttendees,
    banner: raw?.banner || raw?.imageUrl,
    imageUrl: raw?.imageUrl || raw?.banner,
    createdAt: raw?.createdAt,
    status: raw?.status,
  };
};

const toPaginatedEvents = (response: any): PaginatedResponse<Event> => {
  const items = Array.isArray(response?.data) ? response.data : [];
  const page = Number(response?.meta?.page || 1);
  const limit = Number(response?.meta?.limit || items.length || 10);
  const total = Number(response?.meta?.total || items.length || 0);
  const totalPages = Number(response?.meta?.totalPages || 1);

  return {
    data: items.map(normalizeEvent),
    page,
    limit,
    total,
    hasMore: page < totalPages,
  };
};

export const eventApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<
      PaginatedResponse<Event>,
      { page?: number; limit?: number; type?: string; month?: string }
    >({
      query: ({ page = 1, limit = 10, type, month }) => {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (type) params.append('type', type);
        if (month) params.append('month', month);
        return `/events?${params.toString()}`;
      },
      transformResponse: (response: any) => toPaginatedEvents(response),
      providesTags: ['Event'],
    }),
    getEventById: builder.query<ApiResponse<Event>, string>({
      query: (id) => `/events/${id}`,
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeEvent(response?.data?.event || response?.data),
      }),
      providesTags: (result, error, id) => [{ type: 'Event', id }],
    }),
    getMyEvents: builder.query<PaginatedResponse<Event>, { page?: number; limit?: number }>({
      query: () => `/events/my-rsvps`,
      transformResponse: (response: any) => {
        const rsvps = Array.isArray(response?.data?.rsvps) ? response.data.rsvps : [];
        const events = rsvps
          .map((rsvp: any) => rsvp?.Event || rsvp?.event)
          .filter(Boolean)
          .map(normalizeEvent);

        return {
          data: events,
          page: 1,
          limit: events.length || 10,
          total: events.length,
          hasMore: false,
        };
      },
      providesTags: ['Event'],
    }),
    getAttendingEvents: builder.query<PaginatedResponse<Event>, { page?: number; limit?: number }>({
      query: () => `/events/my-rsvps`,
      transformResponse: (response: any) => {
        const rsvps = Array.isArray(response?.data?.rsvps) ? response.data.rsvps : [];
        const going = rsvps.filter((rsvp: any) => rsvp?.status === 'going');
        const events = going
          .map((rsvp: any) => rsvp?.Event || rsvp?.event)
          .filter(Boolean)
          .map(normalizeEvent);

        return {
          data: events,
          page: 1,
          limit: events.length || 10,
          total: events.length,
          hasMore: false,
        };
      },
      providesTags: ['Event'],
    }),
    createEvent: builder.mutation<ApiResponse<Event>, CreateEventData>({
      query: (data) => ({
        url: '/events',
        method: 'POST',
        body: {
          title: data.title,
          description: data.description,
          type: data.type === 'career-fair' ? 'career_fair' : data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          location: data.location || '',
          isVirtual: Boolean(data.isOnline),
          meetingLink: data.meetingLink || '',
          capacity: data.maxAttendees,
          imageUrl: data.banner || '',
        },
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeEvent(response?.data?.event || response?.data),
      }),
      invalidatesTags: ['Event'],
    }),
    updateEvent: builder.mutation<ApiResponse<Event>, { id: string; data: Partial<CreateEventData> }>({
      query: ({ id, data }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: {
          ...data,
          type: data.type === 'career-fair' ? 'career_fair' : data.type,
          isVirtual: data.isOnline,
          capacity: data.maxAttendees,
          imageUrl: data.banner,
        },
      }),
      transformResponse: (response: any) => ({
        ...response,
        data: normalizeEvent(response?.data?.event || response?.data),
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Event', id }],
    }),
    deleteEvent: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'],
    }),
    rsvpEvent: builder.mutation<ApiResponse<Event>, string>({
      query: (id) => ({
        url: `/events/${id}/rsvp`,
        method: 'POST',
        body: { status: 'going' },
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Event', id }],
    }),
    cancelRsvp: builder.mutation<ApiResponse<Event>, string>({
      query: (id) => ({
        url: `/events/${id}/rsvp`,
        method: 'POST',
        body: { status: 'not_going' },
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Event', id }],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetEventByIdQuery,
  useGetMyEventsQuery,
  useGetAttendingEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useRsvpEventMutation,
  useCancelRsvpMutation,
} = eventApi;
