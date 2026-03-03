"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Post extends sequelize_1.Model {
}
Post.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    mediaUrls: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: []
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('text', 'image', 'video', 'document'),
        defaultValue: 'text'
    },
    likes: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0
    },
    comments: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0
    },
    shares: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0
    },
    isPublic: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize: database_1.default,
    tableName: 'posts',
    timestamps: true,
    indexes: [
        // High-frequency feed query: public posts ordered by date
        { fields: ['isPublic', 'createdAt'] },
        // User profile posts
        { fields: ['userId', 'createdAt'] },
        // Cursor-based pagination support
        { fields: ['createdAt', 'id'] }
    ]
});
exports.default = Post;
//# sourceMappingURL=Post.js.map