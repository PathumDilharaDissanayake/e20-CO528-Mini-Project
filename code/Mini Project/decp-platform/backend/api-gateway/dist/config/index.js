"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        expiresIn: '15m',
        refreshExpiresIn: '7d'
    },
    services: {
        auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
        feed: process.env.FEED_SERVICE_URL || 'http://localhost:3003',
        jobs: process.env.JOBS_SERVICE_URL || 'http://localhost:3004',
        events: process.env.EVENTS_SERVICE_URL || 'http://localhost:3005',
        research: process.env.RESEARCH_SERVICE_URL || 'http://localhost:3006',
        messaging: process.env.MESSAGING_SERVICE_URL || 'http://localhost:3007',
        notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
        analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009'
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173']
    }
};
//# sourceMappingURL=index.js.map