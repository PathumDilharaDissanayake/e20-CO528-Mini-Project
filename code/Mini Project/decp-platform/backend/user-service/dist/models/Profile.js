"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Profile extends sequelize_1.Model {
}
Profile.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true
    },
    role: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'student'
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true
    },
    department: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true
    },
    graduationYear: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true
    },
    isEmailVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    bio: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true
    },
    headline: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true
    },
    location: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true
    },
    website: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true
    },
    phone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true
    },
    skills: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: []
    },
    interests: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: []
    },
    education: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: []
    },
    experience: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: []
    },
    socialLinks: {
        type: sequelize_1.DataTypes.JSONB,
        defaultValue: {}
    }
}, {
    sequelize: database_1.default,
    tableName: 'profiles',
    timestamps: true,
    indexes: [
        { fields: ['userId'] }, // already unique but makes intent explicit
        { fields: ['role'] }, // role-based filter in searchUsers
        { fields: ['firstName', 'lastName'] }, // name-based sorting/search
        { fields: ['skills'], using: 'gin' }, // GIN index for @> (contains) skill filter
        { fields: ['createdAt'] } // list ordering
    ]
});
exports.default = Profile;
//# sourceMappingURL=Profile.js.map