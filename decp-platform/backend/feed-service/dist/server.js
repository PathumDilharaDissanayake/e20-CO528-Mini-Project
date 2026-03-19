"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const internalAuth_1 = require("./middleware/internalAuth");
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const database_1 = __importDefault(require("./config/database"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// CORS
app.use((0, cors_1.default)());
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static files for uploads — custom handler to properly set CORS headers
const uploadsDir = process.env.UPLOAD_DIR
    ? path_1.default.resolve(process.env.UPLOAD_DIR)
    : path_1.default.join(__dirname, '..', 'uploads');
// Create a custom static file handler with proper CORS
app.use('/uploads', (req, res, next) => {
    // Set CORS headers for all requests to /uploads
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    // Get the file path
    const filePath = path_1.default.join(uploadsDir, req.path);
    // Check if file exists and serve it
    fs_1.default.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        // Set content type based on extension
        const ext = path_1.default.extname(filePath).toLowerCase();
        const contentTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.pdf': 'application/pdf',
        };
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        // Stream the file
        const stream = fs_1.default.createReadStream(filePath);
        stream.on('error', (streamErr) => {
            res.status(500).json({ success: false, message: 'Error reading file' });
        });
        stream.pipe(res);
    });
});
// OBS-002: Prometheus-compatible /metrics endpoint (no external dependency)
app.get('/metrics', (_req, res) => {
    const m = process.memoryUsage();
    const lines = [
        '# HELP process_uptime_seconds Process uptime in seconds',
        '# TYPE process_uptime_seconds gauge',
        `process_uptime_seconds ${process.uptime().toFixed(3)}`,
        '',
        '# HELP process_memory_heap_used_bytes Heap memory in use',
        '# TYPE process_memory_heap_used_bytes gauge',
        `process_memory_heap_used_bytes ${m.heapUsed}`,
        '',
        '# HELP process_memory_heap_total_bytes Heap memory allocated',
        '# TYPE process_memory_heap_total_bytes gauge',
        `process_memory_heap_total_bytes ${m.heapTotal}`,
        '',
        '# HELP process_memory_rss_bytes Resident set size',
        '# TYPE process_memory_rss_bytes gauge',
        `process_memory_rss_bytes ${m.rss}`,
        '',
        '# HELP nodejs_version_info Node.js version info',
        '# TYPE nodejs_version_info gauge',
        `nodejs_version_info{version="${process.version}"} 1`,
    ];
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(lines.join('\n') + '\n');
});
// SEC-002: Internal service token validation
app.use(internalAuth_1.internalAuthMiddleware);
// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Feed service is healthy',
        data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }
    });
});
// Routes
app.use('/posts', postRoutes_1.default);
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Database connection and server start
const PORT = config_1.config.port;
const startServer = async () => {
    try {
        await database_1.default.authenticate();
        logger_1.logger.info('✅ Database connection established successfully.');
        await database_1.default.sync({ alter: true }); // MIGRATE-001: add new columns to existing tables
        logger_1.logger.info('✅ Database synchronized.');
        app.listen(PORT, () => {
            logger_1.logger.info(`📰 Feed Service running on port ${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Unable to start server:', error);
        process.exit(1);
    }
};
startServer();
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received. Shutting down gracefully...');
    await database_1.default.close();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received. Shutting down gracefully...');
    await database_1.default.close();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=server.js.map