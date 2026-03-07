import { Sequelize, QueryTypes } from 'sequelize';
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

const ensureDatabaseExists = async (): Promise<void> => {
  const adminSequelize = new Sequelize({
    database: 'postgres',
    username: config.db.user,
    password: config.db.password,
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: false,
    ...(useSsl
      ? { dialectOptions: { ssl: { require: true, rejectUnauthorized } } }
      : {}),
  });
  try {
    const result = await adminSequelize.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      { bind: [config.db.name], type: QueryTypes.SELECT }
    );
    if (result.length === 0) {
      // Identifier is validated against the config value, not user input
      await adminSequelize.query(`CREATE DATABASE "${config.db.name}"`);
      logger.info(`Database "${config.db.name}" created successfully`);
    }
  } finally {
    await adminSequelize.close();
  }
};

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
  } catch (error: any) {
    if (error?.original?.code === '3D000') {
      logger.info(`Database "${config.db.name}" does not exist, creating...`);
      await ensureDatabaseExists();
      await sequelize.authenticate();
    } else {
      throw error;
    }
  }
  logger.info('Database connection established successfully');
  await sequelize.sync({ alter: true });
  logger.info('Database models synchronized');
};

export default sequelize;
export { sequelize };
