import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
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

    await sequelize.sync({ alter: true });
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
