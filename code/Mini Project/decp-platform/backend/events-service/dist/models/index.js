"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSVP = exports.Event = void 0;
const Event_1 = __importDefault(require("./Event"));
exports.Event = Event_1.default;
const RSVP_1 = __importDefault(require("./RSVP"));
exports.RSVP = RSVP_1.default;
Event_1.default.hasMany(RSVP_1.default, { foreignKey: 'eventId', as: 'rsvps', onDelete: 'CASCADE' });
RSVP_1.default.belongsTo(Event_1.default, { foreignKey: 'eventId' });
