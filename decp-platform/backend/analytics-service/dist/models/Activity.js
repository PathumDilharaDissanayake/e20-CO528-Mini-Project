"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Activity extends sequelize_1.Model {
}
Activity.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: true },
    action: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    entityType: { type: sequelize_1.DataTypes.ENUM('user', 'post', 'job', 'event', 'research', 'message'), allowNull: false },
    entityId: { type: sequelize_1.DataTypes.UUID, allowNull: true },
    metadata: { type: sequelize_1.DataTypes.JSONB, defaultValue: {} },
    ipAddress: { type: sequelize_1.DataTypes.STRING(45), allowNull: true },
    userAgent: { type: sequelize_1.DataTypes.STRING(500), allowNull: true }
}, { sequelize: database_1.default, tableName: 'activities', timestamps: true, updatedAt: false });
exports.default = Activity;
