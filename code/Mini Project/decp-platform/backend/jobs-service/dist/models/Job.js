"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Job extends sequelize_1.Model {
}
Job.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    company: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    location: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
    type: { type: sequelize_1.DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'remote'), allowNull: false },
    salary: { type: sequelize_1.DataTypes.JSONB, defaultValue: {} },
    requirements: { type: sequelize_1.DataTypes.JSONB, defaultValue: [] },
    skills: { type: sequelize_1.DataTypes.JSONB, defaultValue: [] },
    postedBy: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    status: { type: sequelize_1.DataTypes.ENUM('active', 'closed', 'draft'), defaultValue: 'active' },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
}, { sequelize: database_1.default, tableName: 'jobs', timestamps: true });
exports.default = Job;
//# sourceMappingURL=Job.js.map