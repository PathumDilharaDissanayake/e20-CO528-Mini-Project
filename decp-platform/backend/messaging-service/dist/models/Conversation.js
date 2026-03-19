"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Conversation extends sequelize_1.Model {
}
Conversation.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    type: { type: sequelize_1.DataTypes.ENUM('direct', 'group'), allowNull: false },
    title: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    participants: { type: sequelize_1.DataTypes.JSONB, defaultValue: [] },
    createdBy: { type: sequelize_1.DataTypes.UUID, allowNull: false }
}, { sequelize: database_1.default, tableName: 'conversations', timestamps: true });
exports.default = Conversation;
