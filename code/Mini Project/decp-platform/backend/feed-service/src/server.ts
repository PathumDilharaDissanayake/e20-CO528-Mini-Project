import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
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
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads — custom handler to properly set CORS headers
const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');

// Create a custom static file handler with proper CORS
app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  // Set CORS headers for all requests to /uploads
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Get the file path
  const filePath = path.join(uploadsDir, req.path);
  
  // Check if file exists and serve it
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    // Set content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
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
    const stream = fs.createReadStream(filePath);
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

    await sequelize.sync({ alter: true }); // MIGRATE-001: add new columns to existing tables
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
