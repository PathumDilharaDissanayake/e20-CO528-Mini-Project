"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class RSVP extends sequelize_1.Model {
}
RSVP.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('going', 'maybe', 'not_going'), defaultValue: 'going' }
}, {
    sequelize: database_1.default,
    tableName: 'rsvps',
    timestamps: true,
    indexes: [{ unique: true, fields: ['eventId', 'userId'] }]
});
exports.default = RSVP;
