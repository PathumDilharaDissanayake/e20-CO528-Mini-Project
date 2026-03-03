"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class User extends sequelize_1.Model {
    async comparePassword(candidatePassword) {
        if (!this.password)
            return false;
        return bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }
}
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false
    },
    role: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'student'
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
        defaultValue: false
    },
    emailVerificationToken: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetToken: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true
    },
    passwordResetExpires: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    googleId: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    profilePicture: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true
    },
    lastLogin: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize: database_1.default,
    tableName: 'users',
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                user.password = await bcryptjs_1.default.hash(user.password, 12);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password') && user.password) {
                user.password = await bcryptjs_1.default.hash(user.password, 12);
            }
        }
    }
});
exports.default = User;
//# sourceMappingURL=User.js.map