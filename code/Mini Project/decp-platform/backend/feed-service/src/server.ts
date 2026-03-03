import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { internalAuthMiddleware } from './middleware/internalAuth';
import postRoutes from './routes/postRoutes';
import sequelize from './config/database';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));

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
app.use(internalAuthMiddleware);

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
app.use('/posts', postRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server start
const PORT = config.port;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');

    await sequelize.sync({ force: false }); // MIGRATE-001: create-if-not-exists only — safe for production
    logger.info('✅ Database synchronized.');

    app.listen(PORT, () => {
      logger.info(`📰 Feed Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

export default app;
