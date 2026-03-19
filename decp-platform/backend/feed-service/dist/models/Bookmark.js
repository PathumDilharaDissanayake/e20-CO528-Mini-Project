"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Bookmark extends sequelize_1.Model {
}
Bookmark.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    postId: { type: sequelize_1.DataTypes.UUID, allowNull: false },
}, {
    sequelize: database_1.default,
    modelName: 'Bookmark',
    tableName: 'bookmarks',
    indexes: [{ unique: true, fields: ['userId', 'postId'] }],
    timestamps: true,
    updatedAt: false,
});
exports.default = Bookmark;
//# sourceMappingURL=Bookmark.js.map