"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class ResearchProject extends sequelize_1.Model {
}
ResearchProject.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    title: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
    abstract: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    status: { type: sequelize_1.DataTypes.ENUM('planning', 'active', 'completed', 'on_hold'), defaultValue: 'planning' },
    startDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    endDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    leadResearcherId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
    collaborators: { type: sequelize_1.DataTypes.JSONB, defaultValue: [] },
    tags: { type: sequelize_1.DataTypes.JSONB, defaultValue: [] },
    visibility: { type: sequelize_1.DataTypes.ENUM('public', 'private', 'department'), defaultValue: 'department' },
    documents: { type: sequelize_1.DataTypes.JSONB, defaultValue: [] }
}, { sequelize: database_1.default, tableName: 'research_projects', timestamps: true });
exports.default = ResearchProject;
