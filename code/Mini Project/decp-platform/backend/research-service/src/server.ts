import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import researchRoutes from './routes/researchRoutes';
import sequelize from './config/database';

const app: Application = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Research service is healthy', data: { timestamp: new Date().toISOString(), uptime: process.uptime() } });
});

app.use('/', researchRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected.');
    await sequelize.sync({ alter: true });
    logger.info('✅ Database synchronized.');
    app.listen(PORT, () => { logger.info(`🔬 Research Service running on port ${PORT}`); });
  } catch (error) { logger.error('❌ Unable to start server:', error); process.exit(1); }
};
startServer();
process.on('SIGTERM', async () => { await sequelize.close(); process.exit(0); });
process.on('SIGINT', async () => { await sequelize.close(); process.exit(0); });
export default app;
