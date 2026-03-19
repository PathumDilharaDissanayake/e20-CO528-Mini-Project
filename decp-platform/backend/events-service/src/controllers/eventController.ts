import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Event, RSVP } from '../models';
import { logger } from '../utils/logger';
import Joi from 'joi';
import { sendNotification } from '../utils/notify';

const eventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  type: Joi.string().valid('webinar', 'workshop', 'seminar', 'networking', 'career_fair', 'other').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  location: Joi.string().max(300).allow(''),
  isVirtual: Joi.boolean().default(false),
  meetingLink: Joi.string().uri().allow(''),
  capacity: Joi.number().integer().min(1),
  imageUrl: Joi.string().allow(''),
  coverImage: Joi.string().allow(''),
  tags: Joi.array().items(Joi.string())
});

const rsvpSchema = Joi.object({
  status: Joi.string().valid('going', 'maybe', 'not_going').default('going')
});

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status = 'published', upcoming, attending, userId, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const requestingUserId = req.headers['x-user-id'] as string;

    // If attending=true or userId=me, return events where the current user has an RSVP
    if (attending === 'true' || userId === 'me') {
      if (!requestingUserId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }
      const rsvps = await RSVP.findAll({ where: { userId: requestingUserId, status: { [Op.in]: ['going', 'maybe'] } } });
      const eventIds = rsvps.map((r: any) => r.eventId);

      const where: any = { id: eventIds };
      if (type) where.type = type;
      if (upcoming === 'true') where.startDate = { [Op.gte]: new Date() };

      const { count, rows: events } = await Event.findAndCountAll({
        where,
        order: [['startDate', 'ASC']],
        limit: limitNum,
        offset
      });

      res.json({
        success: true,
        data: events,
        meta: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
      });
      return;
    }

    const where: any = { status };
    if (type) where.type = type;
    if (upcoming === 'true') where.startDate = { [Op.gte]: new Date() };

    const { count, rows: events } = await Event.findAndCountAll({
      where,
      order: [['startDate', 'ASC']],
      limit: limitNum,
      offset
    });

    res.json({
      success: true,
      data: events,
      meta: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) }
    });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByPk(eventId, { include: [{ model: RSVP, as: 'rsvps' }] });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    res.json({ success: true, data: { event } });
  } catch (error) {
    logger.error('Get event error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizerId = req.headers['x-user-id'] as string;
    const { error, value } = eventSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }
    const event = await Event.create({ ...value, organizerId });
    res.status(201).json({ success: true, message: 'Event created successfully', data: { event } });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { eventId } = req.params;
    const event = await Event.findByPk(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (event.organizerId !== userId) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    // Explicitly extract updatable fields to prevent mass-assignment
    const {
      title, description, type, startDate, endDate, location,
      isVirtual, meetingLink, capacity, imageUrl, coverImage, status, tags,
    } = req.body;
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (location !== undefined) updateData.location = location;
    if (isVirtual !== undefined) updateData.isVirtual = isVirtual;
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    await event.update(updateData);
    res.json({ success: true, message: 'Event updated successfully', data: { event } });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { eventId } = req.params;
    const event = await Event.findByPk(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }
    if (event.organizerId !== userId && userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    await event.destroy();
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const rsvpEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { eventId } = req.params;
    const { error, value } = rsvpSchema.validate(req.body);
    if (error) {
      res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
      return;
    }

    const event = await Event.findByPk(eventId);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (event.capacity) {
      const rsvpCount = await RSVP.count({ where: { eventId, status: 'going' } });
      if (rsvpCount >= event.capacity && value.status === 'going') {
        res.status(400).json({ success: false, message: 'Event is at capacity' });
        return;
      }
    }

    const [rsvp, created] = await RSVP.findOrCreate({
      where: { eventId, userId },
      defaults: { eventId, userId, status: value.status }
    });

    if (!created) {
      await rsvp.update({ status: value.status });
    }

    // Fire-and-forget: notify the event organizer (don't notify if user is the organizer)
    const organizerId = (event as any).organizerId;
    if (organizerId && organizerId !== userId && value.status === 'going') {
      const firstName = (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '') as string;
      const lastName = (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '') as string;
      const userName = `${firstName} ${lastName}`.trim() || 'Someone';
      sendNotification(
        organizerId,
        'event',
        'New RSVP',
        `${userName} RSVPd to your event "${(event as any).title}"`,
        { eventId }
      );
    }

    res.json({ success: true, message: 'RSVP updated successfully', data: { rsvp } });
  } catch (error) {
    logger.error('RSVP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMyRSVPs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const rsvps = await RSVP.findAll({
      where: { userId },
      include: [{ model: Event, as: 'Event' }]
    });
    res.json({ success: true, data: { rsvps } });
  } catch (error) {
    logger.error('Get RSVPs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
