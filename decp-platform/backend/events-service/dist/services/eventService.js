"use strict";
/**
 * Event Service — Business logic layer for events-service.
 * Agent: A-06 (Backend Implementation Agent) | 2026-03-03
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rsvpEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getMyRSVPs = exports.getEventById = exports.listEvents = void 0;
const models_1 = require("../models");
// ─── Read ─────────────────────────────────────────────────────────────────────
const listEvents = async (type, status = 'published', page = 1, limit = 10) => {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const offset = (page - 1) * safeLimit;
    const where = { status };
    if (type)
        where.type = type;
    const { count, rows } = await models_1.Event.findAndCountAll({
        where, order: [['startDate', 'ASC']], limit: safeLimit, offset
    });
    return { events: rows, total: count, page, limit: safeLimit, totalPages: Math.ceil(count / safeLimit) };
};
exports.listEvents = listEvents;
const getEventById = async (eventId) => {
    const event = await models_1.Event.findByPk(eventId, { include: [{ model: models_1.RSVP, as: 'rsvps' }] });
    if (!event)
        throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    return event;
};
exports.getEventById = getEventById;
const getMyRSVPs = async (userId) => {
    return models_1.RSVP.findAll({
        where: { userId },
        include: [{ model: models_1.Event, as: 'Event' }],
        order: [['createdAt', 'DESC']]
    });
};
exports.getMyRSVPs = getMyRSVPs;
// ─── Write ────────────────────────────────────────────────────────────────────
const createEvent = async (organizerId, data) => {
    return models_1.Event.create({ ...data, organizerId });
};
exports.createEvent = createEvent;
const updateEvent = async (eventId, userId, data) => {
    const event = await models_1.Event.findByPk(eventId);
    if (!event)
        throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    if (event.organizerId !== userId)
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    return event.update(data);
};
exports.updateEvent = updateEvent;
const deleteEvent = async (eventId, userId, userRole) => {
    const event = await models_1.Event.findByPk(eventId);
    if (!event)
        throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    if (event.organizerId !== userId && userRole !== 'admin') {
        throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
    }
    await event.destroy();
};
exports.deleteEvent = deleteEvent;
const rsvpEvent = async (eventId, userId, status) => {
    const event = await models_1.Event.findByPk(eventId);
    if (!event)
        throw Object.assign(new Error('Event not found'), { statusCode: 404 });
    if (event.capacity && status === 'going') {
        const going = await models_1.RSVP.count({ where: { eventId, status: 'going' } });
        if (going >= event.capacity) {
            throw Object.assign(new Error('Event is at capacity'), { statusCode: 400 });
        }
    }
    const rsvpStatus = status;
    const [rsvp, created] = await models_1.RSVP.findOrCreate({
        where: { eventId, userId },
        defaults: { eventId, userId, status: rsvpStatus }
    });
    if (!created)
        await rsvp.update({ status: rsvpStatus });
    return rsvp;
};
exports.rsvpEvent = rsvpEvent;
