"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Share extends sequelize_1.Model {
}
Share.init({
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
    }
}, {
    sequelize: database_1.default,
    tableName: 'shares',
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['postId', 'userId']
        },
        {
            fields: ['postId']
        }
    ]
});
exports.default = Share;
//# sourceMappingURL=Share.js.map