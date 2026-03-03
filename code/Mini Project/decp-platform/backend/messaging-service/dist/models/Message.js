"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Message extends sequelize_1.Model {
}
Message.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    conversationId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    senderId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    content: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    type: { type: sequelize_1.DataTypes.ENUM('text', 'image', 'file'), defaultValue: 'text' },
    attachmentUrl: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    isDeleted: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize: database_1.default, tableName: 'messages', timestamps: true });
exports.default = Message;
