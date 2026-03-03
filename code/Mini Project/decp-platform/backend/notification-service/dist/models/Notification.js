"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Notification extends sequelize_1.Model {
}
Notification.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    type: { type: sequelize_1.DataTypes.ENUM('message', 'connection', 'job', 'event', 'mention', 'system'), allowNull: false },
    title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    body: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    data: { type: sequelize_1.DataTypes.JSONB, defaultValue: {} },
    isRead: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    readAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
}, {
    sequelize: database_1.default,
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'isRead'] }, // badge count query — critical for performance
        { fields: ['userId', 'createdAt'] } // paginate notifications per user
    ]
});
exports.default = Notification;
