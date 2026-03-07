import { Sequelize } from 'sequelize';
import { config } from './index';
import { logger } from '../utils/logger';

const isLocalDatabaseHost = ['localhost', '127.0.0.1', 'postgres'].includes(config.db.host);
const useSsl = (process.env.DB_SSL ?? (isLocalDatabaseHost ? 'false' : 'true')).toLowerCase() === 'true';
const rejectUnauthorized = (process.env.DB_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';

const sequelize = new Sequelize({
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...(useSsl
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized,
          },
        },
      }
    : {})
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync models (development only)
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized');
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

export default sequelize;
export { sequelize };
