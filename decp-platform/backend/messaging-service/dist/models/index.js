"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.Conversation = void 0;
const Conversation_1 = __importDefault(require("./Conversation"));
exports.Conversation = Conversation_1.default;
const Message_1 = __importDefault(require("./Message"));
exports.Message = Message_1.default;
Conversation_1.default.hasMany(Message_1.default, { foreignKey: 'conversationId', as: 'messages', onDelete: 'CASCADE' });
Message_1.default.belongsTo(Conversation_1.default, { foreignKey: 'conversationId' });
