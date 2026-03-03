import express, { Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import conversationRoutes from './routes/conversationRoutes';
import { setupSocketIO } from './socket';
import sequelize from './config/database';

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Messaging service is healthy', data: { timestamp: new Date().toISOString(), uptime: process.uptime() } });
});

app.use('/', conversationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

// Setup Socket.IO
setupSocketIO(io);

const PORT = config.port;
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connected.');
    await sequelize.sync({ alter: true });
    logger.info('✅ Database synchronized.');
    httpServer.listen(PORT, () => { logger.info(`💬 Messaging Service running on port ${PORT}`); });
  } catch (error) { logger.error('❌ Unable to start server:', error); process.exit(1); }
};
startServer();
process.on('SIGTERM', async () => { await sequelize.close(); process.exit(0); });
process.on('SIGINT', async () => { await sequelize.close(); process.exit(0); });
export { app, io };
