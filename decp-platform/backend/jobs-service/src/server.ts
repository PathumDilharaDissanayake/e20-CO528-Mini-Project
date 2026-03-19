import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { internalAuthMiddleware } from './middleware/internalAuth';
import jobRoutes from './routes/jobRoutes';
import sequelize from './config/database';

const app: Application = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Jobs service is healthy', data: { timestamp: new Date().toISOString(), uptime: process.uptime() } });
});

app.use('/', jobRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected.');
    await sequelize.sync({ force: false }); // MIGRATE-001: create-if-not-exists only — safe for production
    logger.info('✅ Database synchronized.');
    app.listen(PORT, () => { logger.info(`💼 Jobs Service running on port ${PORT}`); });
  } catch (error) { logger.error('❌ Unable to start server:', error); process.exit(1); }
};

startServer();
process.on('SIGTERM', async () => { await sequelize.close(); process.exit(0); });
process.on('SIGINT', async () => { await sequelize.close(); process.exit(0); });
export default app;
