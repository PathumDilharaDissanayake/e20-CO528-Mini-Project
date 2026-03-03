import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import sequelize from './config/database';
import './controllers/oauthController'; // Initialize passport

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS - Allow all origins for development
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport initialization
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Routes
app.use('/', authRoutes);

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
      logger.info(`🔐 Auth Service running on port ${PORT}`);
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
