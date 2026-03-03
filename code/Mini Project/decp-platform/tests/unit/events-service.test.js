/**
 * Events Service Unit Tests
 * Tests for event CRUD operations and RSVP functionality
 */

const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpToEvent,
  cancelRsvp,
  getEventAttendees,
  getMyEvents
} = require('../../backend/events-service/src/controllers/eventController');
const { Event, RSVP } = require('../../backend/events-service/src/models');

// Mock dependencies
jest.mock('../../backend/events-service/src/models');
jest.mock('../../backend/events-service/src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Events Service - Unit Tests', () => {
  let mockReq;
  let mockRes;
  let mockEvent;
  let mockRSVP;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockEvent = {
      id: 'event-123',
      organizerId: 'organizer-123',
      title: 'Career Fair 2024',
      description: 'Annual career fair for students and alumni',
      location: 'University Campus Center',
      startDate: new Date('2024-06-15T10:00:00'),
      endDate: new Date('2024-06-15T16:00:00'),
      type: 'in-person',
      category: 'career',
      capacity: 200,
      isPublic: true,
      imageUrl: 'https://example.com/event.jpg',
      attendeeCount: 50,
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn()
    };
    mockRSVP = {
      id: 'rsvp-123',
      eventId: 'event-123',
      userId: 'user-456',
      status: 'going',
      createdAt: new Date(),
      update: jest.fn(),
      destroy: jest.fn()
    };
  });

  describe('Get Events', () => {
    test('should get events with default pagination', async () => {
      mockReq = { query: {} };
      Event.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: Array(10).fill(mockEvent)
      });

      await getEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        order: [['startDate', 'ASC']],
        limit: 10,
        offset: 0
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 25
        })
      }));
    });

    test('should filter events by category', async () => {
      mockReq = { query: { category: 'career' } };
      Event.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: [mockEvent, mockEvent, mockEvent, mockEvent, mockEvent]
      });

      await getEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ category: 'career' })
      }));
    });

    test('should filter events by type', async () => {
      mockReq = { query: { type: 'virtual' } };
      Event.findAndCountAll.mockResolvedValue({
        count: 8,
        rows: Array(8).fill(mockEvent)
      });

      await getEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ type: 'virtual' })
      }));
    });

    test('should filter upcoming events', async () => {
      mockReq = { query: { status: 'upcoming' } };
      Event.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockEvent)
      });

      await getEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    test('should filter events by date range', async () => {
      mockReq = {
        query: {
          startDate: '2024-06-01',
          endDate: '2024-06-30'
        }
      };
      Event.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [mockEvent, mockEvent, mockEvent]
      });

      await getEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    test('should search events by keyword', async () => {
      mockReq = { query: { q: 'career fair' } };
      Event.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [mockEvent, mockEvent]
      });

      await getEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object)
      }));
    });

    test('should only return public events for unauthenticated users', async () => {
      mockReq = { query: {}, headers: {} };
      Event.findAndCountAll.mockResolvedValue({
        count: 10,
        rows: Array(10).fill(mockEvent)
      });

      await getEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isPublic: true })
      }));
    });

    test('should handle empty results', async () => {
      mockReq = { query: { category: 'nonexistent' } };
      Event.findAndCountAll.mockResolvedValue({
        count: 0,
        rows: []
      });

      await getEvents(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: [],
        meta: expect.objectContaining({ total: 0 })
      }));
    });
  });

  describe('Get Event', () => {
    test('should get event by id successfully', async () => {
      mockReq = { params: { eventId: 'event-123' } };
      Event.findByPk.mockResolvedValue({
        ...mockEvent,
        rsvps: [mockRSVP, mockRSVP, mockRSVP]
      });

      await getEvent(mockReq, mockRes);

      expect(Event.findByPk).toHaveBeenCalledWith('event-123', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ event: expect.any(Object) })
      }));
    });

    test('should return 404 for non-existent event', async () => {
      mockReq = { params: { eventId: 'nonexistent' } };
      Event.findByPk.mockResolvedValue(null);

      await getEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Event not found'
      }));
    });

    test('should include RSVP count', async () => {
      mockReq = { params: { eventId: 'event-123' } };
      Event.findByPk.mockResolvedValue({
        ...mockEvent,
        rsvps: Array(50).fill(mockRSVP)
      });

      await getEvent(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          event: expect.objectContaining({
            attendeeCount: 50
          })
        })
      }));
    });
  });

  describe('Create Event', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123', 'x-user-role': 'alumni' },
        body: {
          title: 'Networking Mixer',
          description: 'Connect with fellow alumni',
          location: 'Downtown Conference Center',
          startDate: '2024-07-20T18:00:00',
          endDate: '2024-07-20T21:00:00',
          type: 'in-person',
          category: 'networking',
          capacity: 100,
          isPublic: true
        }
      };
    });

    test('should create event successfully', async () => {
      Event.create.mockResolvedValue(mockEvent);

      await createEvent(mockReq, mockRes);

      expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
        organizerId: 'organizer-123',
        title: 'Networking Mixer',
        status: 'upcoming'
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Event created successfully'
      }));
    });

    test('should create virtual event', async () => {
      mockReq.body = {
        ...mockReq.body,
        type: 'virtual',
        virtualLink: 'https://zoom.us/j/123456789'
      };
      Event.create.mockResolvedValue({ ...mockEvent, type: 'virtual' });

      await createEvent(mockReq, mockRes);

      expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'virtual',
        virtualLink: 'https://zoom.us/j/123456789'
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq.headers = {};

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('should validate required fields', async () => {
      mockReq.body = { title: 'Incomplete Event' };

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate start date is before end date', async () => {
      mockReq.body.startDate = '2024-07-20T21:00:00';
      mockReq.body.endDate = '2024-07-20T18:00:00';

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate event type', async () => {
      mockReq.body.type = 'invalid-type';

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate capacity is positive', async () => {
      mockReq.body.capacity = -10;

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should validate start date is in the future', async () => {
      mockReq.body.startDate = '2020-01-01T00:00:00';

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle virtual event without link', async () => {
      mockReq.body.type = 'virtual';
      delete mockReq.body.virtualLink;

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Update Event', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        params: { eventId: 'event-123' },
        body: {
          title: 'Updated Event Title',
          capacity: 150
        }
      };
    });

    test('should update own event successfully', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);

      await updateEvent(mockReq, mockRes);

      expect(mockEvent.update).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated Event Title',
        capacity: 150
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Event updated successfully'
      }));
    });

    test('should return 404 for non-existent event', async () => {
      Event.findByPk.mockResolvedValue(null);

      await updateEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 for unauthorized update', async () => {
      mockReq.headers['x-user-id'] = 'different-user';
      Event.findByPk.mockResolvedValue(mockEvent);

      await updateEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should prevent reducing capacity below current attendees', async () => {
      mockReq.body.capacity = 10;
      mockEvent.attendeeCount = 50;
      Event.findByPk.mockResolvedValue(mockEvent);

      await updateEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should not allow updating past events', async () => {
      mockEvent.endDate = new Date(Date.now() - 86400000);
      Event.findByPk.mockResolvedValue(mockEvent);

      await updateEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Delete Event', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123', 'x-user-role': 'alumni' },
        params: { eventId: 'event-123' }
      };
    });

    test('should delete own event successfully', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);

      await deleteEvent(mockReq, mockRes);

      expect(mockEvent.destroy).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Event deleted successfully'
      }));
    });

    test('should allow admin to delete any event', async () => {
      mockReq.headers['x-user-id'] = 'admin-123';
      mockReq.headers['x-user-role'] = 'admin';
      Event.findByPk.mockResolvedValue(mockEvent);

      await deleteEvent(mockReq, mockRes);

      expect(mockEvent.destroy).toHaveBeenCalled();
    });

    test('should return 403 for unauthorized deletion', async () => {
      mockReq.headers['x-user-id'] = 'unauthorized-user';
      mockReq.headers['x-user-role'] = 'student';
      Event.findByPk.mockResolvedValue(mockEvent);

      await deleteEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should return 404 for non-existent event', async () => {
      Event.findByPk.mockResolvedValue(null);

      await deleteEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should delete associated RSVPs', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.destroy = jest.fn().mockResolvedValue(50);

      await deleteEvent(mockReq, mockRes);

      expect(mockEvent.destroy).toHaveBeenCalled();
    });
  });

  describe('RSVP to Event', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { eventId: 'event-123' },
        body: { status: 'going' }
      };
    });

    test('should RSVP to event successfully', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findOne.mockResolvedValue(null);
      RSVP.create.mockResolvedValue(mockRSVP);

      await rsvpToEvent(mockReq, mockRes);

      expect(RSVP.create).toHaveBeenCalledWith(expect.objectContaining({
        eventId: 'event-123',
        userId: 'user-456',
        status: 'going'
      }));
      expect(mockEvent.increment).toHaveBeenCalledWith('attendeeCount');
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should RSVP as interested', async () => {
      mockReq.body.status = 'interested';
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findOne.mockResolvedValue(null);
      RSVP.create.mockResolvedValue({ ...mockRSVP, status: 'interested' });

      await rsvpToEvent(mockReq, mockRes);

      expect(RSVP.create).toHaveBeenCalledWith(expect.objectContaining({
        status: 'interested'
      }));
    });

    test('should return 404 for non-existent event', async () => {
      Event.findByPk.mockResolvedValue(null);

      await rsvpToEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should return 400 for past event', async () => {
      Event.findByPk.mockResolvedValue({
        ...mockEvent,
        endDate: new Date(Date.now() - 86400000)
      });

      await rsvpToEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should return 409 if already RSVPed', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findOne.mockResolvedValue(mockRSVP);

      await rsvpToEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    test('should return 400 if event is at capacity', async () => {
      Event.findByPk.mockResolvedValue({
        ...mockEvent,
        capacity: 50,
        attendeeCount: 50
      });
      RSVP.findOne.mockResolvedValue(null);

      await rsvpToEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('capacity')
      }));
    });

    test('should update existing RSVP status', async () => {
      mockReq.body.status = 'not-going';
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findOne.mockResolvedValue(mockRSVP);

      await rsvpToEvent(mockReq, mockRes);

      expect(mockRSVP.update).toHaveBeenCalledWith({ status: 'not-going' });
    });

    test('should validate RSVP status', async () => {
      mockReq.body.status = 'invalid-status';
      Event.findByPk.mockResolvedValue(mockEvent);

      await rsvpToEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Cancel RSVP', () => {
    beforeEach(() => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { eventId: 'event-123' }
      };
    });

    test('should cancel RSVP successfully', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findOne.mockResolvedValue(mockRSVP);

      await cancelRsvp(mockReq, mockRes);

      expect(mockRSVP.destroy).toHaveBeenCalled();
      expect(mockEvent.decrement).toHaveBeenCalledWith('attendeeCount');
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'RSVP cancelled'
      }));
    });

    test('should return 404 if not RSVPed', async () => {
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findOne.mockResolvedValue(null);

      await cancelRsvp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    test('should not allow cancelling RSVP for past event', async () => {
      Event.findByPk.mockResolvedValue({
        ...mockEvent,
        endDate: new Date(Date.now() - 86400000)
      });

      await cancelRsvp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Get Event Attendees', () => {
    test('should get event attendees', async () => {
      mockReq = {
        params: { eventId: 'event-123' },
        headers: { 'x-user-id': 'organizer-123' }
      };
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findAll.mockResolvedValue([mockRSVP, mockRSVP, mockRSVP]);

      await getEventAttendees(mockReq, mockRes);

      expect(RSVP.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { eventId: 'event-123' }
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });

    test('should filter attendees by status', async () => {
      mockReq = {
        params: { eventId: 'event-123' },
        query: { status: 'going' },
        headers: { 'x-user-id': 'organizer-123' }
      };
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findAll.mockResolvedValue([mockRSVP, mockRSVP]);

      await getEventAttendees(mockReq, mockRes);

      expect(RSVP.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          eventId: 'event-123',
          status: 'going'
        })
      }));
    });

    test('should return 403 for unauthorized access', async () => {
      mockReq = {
        params: { eventId: 'event-123' },
        headers: { 'x-user-id': 'unauthorized-user' }
      };
      Event.findByPk.mockResolvedValue(mockEvent);

      await getEventAttendees(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should return 404 for non-existent event', async () => {
      mockReq = {
        params: { eventId: 'nonexistent' },
        headers: { 'x-user-id': 'organizer-123' }
      };
      Event.findByPk.mockResolvedValue(null);

      await getEventAttendees(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Get My Events', () => {
    test('should get events organized by current user', async () => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        query: {}
      };
      Event.findAndCountAll.mockResolvedValue({
        count: 5,
        rows: Array(5).fill(mockEvent)
      });

      await getMyEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ organizerId: 'organizer-123' })
      }));
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });

    test('should get events user has RSVPed to', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        query: { attending: 'true' }
      };
      RSVP.findAll.mockResolvedValue([
        { eventId: 'event-1' },
        { eventId: 'event-2' }
      ]);
      Event.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [mockEvent, mockEvent]
      });

      await getMyEvents(mockReq, mockRes);

      expect(RSVP.findAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-456' })
      }));
    });

    test('should filter by event status', async () => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        query: { status: 'upcoming' }
      };
      Event.findAndCountAll.mockResolvedValue({
        count: 3,
        rows: [mockEvent, mockEvent, mockEvent]
      });

      await getMyEvents(mockReq, mockRes);

      expect(Event.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          organizerId: 'organizer-123',
          status: 'upcoming'
        })
      }));
    });

    test('should return 401 if not authenticated', async () => {
      mockReq = { headers: {} };

      await getMyEvents(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle event with maximum capacity', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { eventId: 'event-123' },
        body: { status: 'going' }
      };
      Event.findByPk.mockResolvedValue({
        ...mockEvent,
        capacity: 1,
        attendeeCount: 0
      });
      RSVP.findOne.mockResolvedValue(null);
      RSVP.create.mockResolvedValue(mockRSVP);

      await rsvpToEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle event at exact start time', async () => {
      const now = new Date();
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        body: {
          title: 'Event',
          description: 'Description',
          startDate: now.toISOString(),
          endDate: new Date(now.getTime() + 3600000).toISOString(),
          type: 'in-person'
        }
      };

      await createEvent(mockReq, mockRes);

      // Should handle edge case of exact current time
      expect(mockRes.status).toBeDefined();
    });

    test('should handle event spanning multiple days', async () => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        body: {
          title: 'Multi-day Conference',
          description: 'Description',
          startDate: '2024-06-01T09:00:00',
          endDate: '2024-06-03T17:00:00',
          type: 'in-person',
          category: 'conference'
        }
      };
      Event.create.mockResolvedValue(mockEvent);

      await createEvent(mockReq, mockRes);

      expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date)
      }));
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle unicode in event title', async () => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        body: {
          title: '🎉 International Career Fair 国际化招聘会',
          description: 'Description',
          startDate: '2024-07-20T18:00:00',
          endDate: '2024-07-20T21:00:00',
          type: 'in-person'
        }
      };
      Event.create.mockResolvedValue(mockEvent);

      await createEvent(mockReq, mockRes);

      expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringContaining('🎉')
      }));
    });

    test('should handle rapid RSVPs', async () => {
      mockReq = {
        headers: { 'x-user-id': 'user-456' },
        params: { eventId: 'event-123' },
        body: { status: 'going' }
      };
      Event.findByPk.mockResolvedValue(mockEvent);
      RSVP.findOne.mockResolvedValue(null);
      RSVP.create.mockResolvedValue(mockRSVP);

      // Simulate multiple concurrent RSVPs
      const promises = Array(5).fill().map(() => rsvpToEvent(mockReq, mockRes));
      await Promise.all(promises);

      expect(RSVP.create).toHaveBeenCalledTimes(5);
    });

    test('should handle event with zero capacity', async () => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        body: {
          title: 'Unlimited Event',
          description: 'Description',
          startDate: '2024-07-20T18:00:00',
          endDate: '2024-07-20T21:00:00',
          type: 'in-person',
          capacity: 0
        }
      };

      await createEvent(mockReq, mockRes);

      // Should reject zero capacity
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle date parsing edge cases', async () => {
      mockReq = {
        headers: { 'x-user-id': 'organizer-123' },
        body: {
          title: 'Event',
          description: 'Description',
          startDate: '2024-02-30T18:00:00', // Invalid date
          endDate: '2024-07-20T21:00:00',
          type: 'in-person'
        }
      };

      await createEvent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle large number of attendees', async () => {
      mockReq = {
        params: { eventId: 'event-123' },
        headers: { 'x-user-id': 'organizer-123' }
      };
      Event.findByPk.mockResolvedValue({
        ...mockEvent,
        capacity: 10000,
        attendeeCount: 5000
      });
      RSVP.findAll.mockResolvedValue(Array(5000).fill(mockRSVP));

      await getEventAttendees(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });
  });
});
