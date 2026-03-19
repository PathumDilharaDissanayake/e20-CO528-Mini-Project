"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Application extends sequelize_1.Model {
}
Application.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    jobId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    resumeUrl: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    coverLetter: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    status: { type: sequelize_1.DataTypes.ENUM('pending', 'reviewing', 'interview', 'offered', 'rejected', 'withdrawn'), defaultValue: 'pending' },
    answers: { type: sequelize_1.DataTypes.JSONB, defaultValue: {} }
}, {
    sequelize: database_1.default,
    tableName: 'applications',
    timestamps: true,
    indexes: [{ unique: true, fields: ['jobId', 'userId'] }]
});
exports.default = Application;
//# sourceMappingURL=Application.js.map