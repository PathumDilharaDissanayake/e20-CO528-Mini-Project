import { Sequelize } from 'sequelize';
import { config } from './index';
import { logger } from '../utils/logger';

const localDatabaseHosts = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);
const normalizedDbHost = (config.db.host || '').trim().toLowerCase();
const isLocalDatabaseHost = localDatabaseHosts.has(normalizedDbHost);

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.trim().toLowerCase() === 'true';
};

const useSsl = parseBoolean(process.env.DB_SSL, !isLocalDatabaseHost);
const rejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);

logger.info(
  `DB connection config: host=${config.db.host}, port=${config.db.port}, ssl=${useSsl}, sslRejectUnauthorized=${rejectUnauthorized}`
);

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
