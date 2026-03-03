"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const proxyRoutes_1 = __importDefault(require("./routes/proxyRoutes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
// CORS configuration - Allow all origins for development
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Compression
app.use((0, compression_1.default)());
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim())
    }
}));
// Rate limiting
app.use(rateLimiter_1.rateLimiter);
// Health check (before proxy routes)
app.use('/', healthRoutes_1.default);
// Proxy routes to microservices
app.use('/', proxyRoutes_1.default);
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = config_1.config.port;
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 API Gateway running on port ${PORT}`);
    logger_1.logger.info(`📍 Environment: ${config_1.config.nodeEnv}`);
    logger_1.logger.info('🔗 Connected services:');
    Object.entries(config_1.config.services).forEach(([name, url]) => {
        logger_1.logger.info(`   - ${name}: ${url}`);
    });
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=server.js.map