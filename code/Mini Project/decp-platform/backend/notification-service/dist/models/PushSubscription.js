"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class PushSubscription extends sequelize_1.Model {
}
PushSubscription.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    endpoint: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    p256dh: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    auth: { type: sequelize_1.DataTypes.STRING(200), allowNull: false }
}, { sequelize: database_1.default, tableName: 'push_subscriptions', timestamps: true });
exports.default = PushSubscription;
