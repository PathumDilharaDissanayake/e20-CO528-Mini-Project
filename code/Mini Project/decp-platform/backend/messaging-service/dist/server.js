"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const conversationRoutes_1 = __importDefault(require("./routes/conversationRoutes"));
const socket_1 = require("./socket");
const database_1 = __importDefault(require("./config/database"));
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
exports.io = io;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Messaging service is healthy', data: { timestamp: new Date().toISOString(), uptime: process.uptime() } });
});
app.use('/', conversationRoutes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Setup Socket.IO
(0, socket_1.setupSocketIO)(io);
const PORT = config_1.config.port;
const startServer = async () => {
    try {
        await database_1.default.authenticate();
        logger_1.logger.info('✅ Database connected.');
        await database_1.default.sync({ alter: true });
        logger_1.logger.info('✅ Database synchronized.');
        httpServer.listen(PORT, () => { logger_1.logger.info(`💬 Messaging Service running on port ${PORT}`); });
    }
    catch (error) {
        logger_1.logger.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};
startServer();
process.on('SIGTERM', async () => { await database_1.default.close(); process.exit(0); });
process.on('SIGINT', async () => { await database_1.default.close(); process.exit(0); });
