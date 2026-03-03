"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Connection extends sequelize_1.Model {
}
Connection.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    followerId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    followingId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'accepted', 'blocked'),
        defaultValue: 'pending'
    }
}, {
    sequelize: database_1.default,
    tableName: 'connections',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['followerId', 'followingId']
        }
    ]
});
exports.default = Connection;
//# sourceMappingURL=Connection.js.map