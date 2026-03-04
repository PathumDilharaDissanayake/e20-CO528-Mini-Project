"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyRSVPs = exports.rsvpEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvent = exports.getEvents = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
const notify_1 = require("../utils/notify");
const eventSchema = joi_1.default.object({
    title: joi_1.default.string().min(3).max(200).required(),
    description: joi_1.default.string().min(10).required(),
    type: joi_1.default.string().valid('webinar', 'workshop', 'seminar', 'networking', 'career_fair', 'other').required(),
    startDate: joi_1.default.date().iso().required(),
    endDate: joi_1.default.date().iso().required(),
    location: joi_1.default.string().max(300).allow(''),
    isVirtual: joi_1.default.boolean().default(false),
    meetingLink: joi_1.default.string().uri().allow(''),
    capacity: joi_1.default.number().integer().min(1),
    imageUrl: joi_1.default.string().allow(''),
    coverImage: joi_1.default.string().allow(''),
    tags: joi_1.default.array().items(joi_1.default.string())
});
const rsvpSchema = joi_1.default.object({
    status: joi_1.default.string().valid('going', 'maybe', 'not_going').default('going')
});
const getEvents = async (req, res) => {
    try {
        const { type, status = 'published', upcoming, attending, userId, page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const requestingUserId = req.headers['x-user-id'];
        // If attending=true or userId=me, return events where the current user has an RSVP
        if (attending === 'true' || userId === 'me') {
            if (!requestingUserId) {
                res.status(401).json({ success: false, message: 'Authentication required' });
                return;
            }
            const rsvps = await models_1.RSVP.findAll({ where: { userId: requestingUserId, status: { [sequelize_1.Op.in]: ['going', 'maybe'] } } });
            const eventIds = rsvps.map((r) => r.eventId);
            const where = { id: eventIds };
            if (type)
                where.type = type;
            if (upcoming === 'true')
                where.startDate = { [sequelize_1.Op.gte]: new Date() };
            const { count, rows: events } = await models_1.Event.findAndCountAll({
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
        const where = { status };
        if (type)
            where.type = type;
        if (upcoming === 'true')
            where.startDate = { [sequelize_1.Op.gte]: new Date() };
        const { count, rows: events } = await models_1.Event.findAndCountAll({
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
    }
    catch (error) {
        logger_1.logger.error('Get events error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getEvents = getEvents;
const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await models_1.Event.findByPk(eventId, { include: [{ model: models_1.RSVP, as: 'rsvps' }] });
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        res.json({ success: true, data: { event } });
    }
    catch (error) {
        logger_1.logger.error('Get event error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getEvent = getEvent;
const createEvent = async (req, res) => {
    try {
        const organizerId = req.headers['x-user-id'];
        const { error, value } = eventSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const event = await models_1.Event.create({ ...value, organizerId });
        res.status(201).json({ success: true, message: 'Event created successfully', data: { event } });
    }
    catch (error) {
        logger_1.logger.error('Create event error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { eventId } = req.params;
        const event = await models_1.Event.findByPk(eventId);
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        if (event.organizerId !== userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        // Explicitly extract updatable fields to prevent mass-assignment
        const { title, description, type, startDate, endDate, location, isVirtual, meetingLink, capacity, imageUrl, coverImage, status, tags, } = req.body;
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (type !== undefined)
            updateData.type = type;
        if (startDate !== undefined)
            updateData.startDate = startDate;
        if (endDate !== undefined)
            updateData.endDate = endDate;
        if (location !== undefined)
            updateData.location = location;
        if (isVirtual !== undefined)
            updateData.isVirtual = isVirtual;
        if (meetingLink !== undefined)
            updateData.meetingLink = meetingLink;
        if (capacity !== undefined)
            updateData.capacity = capacity;
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl;
        if (coverImage !== undefined)
            updateData.coverImage = coverImage;
        if (status !== undefined)
            updateData.status = status;
        if (tags !== undefined)
            updateData.tags = tags;
        await event.update(updateData);
        res.json({ success: true, message: 'Event updated successfully', data: { event } });
    }
    catch (error) {
        logger_1.logger.error('Update event error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];
        const { eventId } = req.params;
        const event = await models_1.Event.findByPk(eventId);
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
    }
    catch (error) {
        logger_1.logger.error('Delete event error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.deleteEvent = deleteEvent;
const rsvpEvent = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const { eventId } = req.params;
        const { error, value } = rsvpSchema.validate(req.body);
        if (error) {
            res.status(400).json({ success: false, message: 'Validation error', error: error.details[0].message });
            return;
        }
        const event = await models_1.Event.findByPk(eventId);
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        if (event.capacity) {
            const rsvpCount = await models_1.RSVP.count({ where: { eventId, status: 'going' } });
            if (rsvpCount >= event.capacity && value.status === 'going') {
                res.status(400).json({ success: false, message: 'Event is at capacity' });
                return;
            }
        }
        const [rsvp, created] = await models_1.RSVP.findOrCreate({
            where: { eventId, userId },
            defaults: { eventId, userId, status: value.status }
        });
        if (!created) {
            await rsvp.update({ status: value.status });
        }
        // Fire-and-forget: notify the event organizer (don't notify if user is the organizer)
        const organizerId = event.organizerId;
        if (organizerId && organizerId !== userId && value.status === 'going') {
            const firstName = (req.headers['x-user-firstname'] || req.headers['x-user-firstName'] || '');
            const lastName = (req.headers['x-user-lastname'] || req.headers['x-user-lastName'] || '');
            const userName = `${firstName} ${lastName}`.trim() || 'Someone';
            (0, notify_1.sendNotification)(organizerId, 'event', 'New RSVP', `${userName} RSVPd to your event "${event.title}"`, { eventId });
        }
        res.json({ success: true, message: 'RSVP updated successfully', data: { rsvp } });
    }
    catch (error) {
        logger_1.logger.error('RSVP error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.rsvpEvent = rsvpEvent;
const getMyRSVPs = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const rsvps = await models_1.RSVP.findAll({
            where: { userId },
            include: [{ model: models_1.Event, as: 'Event' }]
        });
        res.json({ success: true, data: { rsvps } });
    }
    catch (error) {
        logger_1.logger.error('Get RSVPs error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getMyRSVPs = getMyRSVPs;
