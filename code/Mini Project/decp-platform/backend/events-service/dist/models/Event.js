"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Event extends sequelize_1.Model {
}
Event.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    type: { type: sequelize_1.DataTypes.ENUM('webinar', 'workshop', 'seminar', 'networking', 'career_fair', 'other'), allowNull: false },
    startDate: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    endDate: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    location: { type: sequelize_1.DataTypes.STRING(300), allowNull: true },
    isVirtual: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    meetingLink: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    organizerId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    capacity: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    imageUrl: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    status: { type: sequelize_1.DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'), defaultValue: 'draft' },
    tags: { type: sequelize_1.DataTypes.JSONB, defaultValue: [] }
}, { sequelize: database_1.default, tableName: 'events', timestamps: true });
exports.default = Event;
