"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class RefreshToken extends sequelize_1.Model {
}
RefreshToken.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    token: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        unique: true
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    expiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false
    },
    isRevoked: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize: database_1.default,
    tableName: 'refresh_tokens',
    timestamps: true
});
exports.default = RefreshToken;
//# sourceMappingURL=RefreshToken.js.map