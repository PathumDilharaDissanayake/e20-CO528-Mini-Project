"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyRSVPs = exports.rsvpEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvent = exports.getEvents = void 0;
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
const joi_1 = __importDefault(require("joi"));
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
    imageUrl: joi_1.default.string().uri().allow(''),
    tags: joi_1.default.array().items(joi_1.default.string())
});
const rsvpSchema = joi_1.default.object({
    status: joi_1.default.string().valid('going', 'maybe', 'not_going').default('going')
});
const getEvents = async (req, res) => {
    try {
        const { type, status = 'published', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = { status };
        if (type)
            where.type = type;
        const { count, rows: events } = await models_1.Event.findAndCountAll({
            where,
            order: [['startDate', 'ASC']],
            limit: parseInt(limit),
            offset
        });
        res.json({
            success: true,
            data: events,
            meta: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) }
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
        await event.update(req.body);
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
