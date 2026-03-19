"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = exports.Job = void 0;
const Job_1 = __importDefault(require("./Job"));
exports.Job = Job_1.default;
const Application_1 = __importDefault(require("./Application"));
exports.Application = Application_1.default;
Job_1.default.hasMany(Application_1.default, { foreignKey: 'jobId', as: 'applications', onDelete: 'CASCADE' });
Application_1.default.belongsTo(Job_1.default, { foreignKey: 'jobId' });
//# sourceMappingURL=index.js.map