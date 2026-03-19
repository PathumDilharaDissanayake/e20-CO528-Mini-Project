"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [EVENTS-SERVICE] [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0)
        msg += ` ${JSON.stringify(metadata)}`;
    if (stack)
        msg += `\n${stack}`;
    return msg;
});
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
    transports: [
        new winston_1.default.transports.Console({ format: combine(colorize(), logFormat) }),
        new winston_1.default.transports.File({ filename: 'logs/events-error.log', level: 'error', format: logFormat }),
        new winston_1.default.transports.File({ filename: 'logs/events-combined.log', format: logFormat })
    ]
});
exports.default = exports.logger;
