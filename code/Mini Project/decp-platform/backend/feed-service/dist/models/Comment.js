"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Comment extends sequelize_1.Model {
}
Comment.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    postId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    author: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    parentId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true
    }
}, {
    sequelize: database_1.default,
    tableName: 'comments',
    timestamps: true,
    indexes: [
        // Fetch comments by post, newest first
        { fields: ['postId', 'createdAt'] },
        // Threaded replies
        { fields: ['parentId'] }
    ]
});
exports.default = Comment;
//# sourceMappingURL=Comment.js.map