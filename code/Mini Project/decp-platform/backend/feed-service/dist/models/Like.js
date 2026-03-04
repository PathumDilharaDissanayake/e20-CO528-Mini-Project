"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Like extends sequelize_1.Model {
}
Like.init({
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
    reactionType: {
        type: sequelize_1.DataTypes.ENUM('like', 'love', 'celebrate', 'insightful', 'curious'),
        defaultValue: 'like',
        allowNull: false,
    },
}, {
    sequelize: database_1.default,
    tableName: 'likes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['postId', 'userId']
        }
    ]
});
exports.default = Like;
//# sourceMappingURL=Like.js.map