"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.connectDatabase = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("./index");
const logger_1 = require("../utils/logger");
const localDatabaseHosts = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);
const normalizedDbHost = (index_1.config.db.host || '').trim().toLowerCase();
const isLocalDatabaseHost = localDatabaseHosts.has(normalizedDbHost);
const parseBoolean = (value, defaultValue) => {
    if (value === undefined) {
        return defaultValue;
    }
    return value.trim().toLowerCase() === 'true';
};
const useSsl = parseBoolean(process.env.DB_SSL, !isLocalDatabaseHost);
const rejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);
logger_1.logger.info(`DB connection config: host=${index_1.config.db.host}, port=${index_1.config.db.port}, ssl=${useSsl}, sslRejectUnauthorized=${rejectUnauthorized}`);
const sequelize = new sequelize_1.Sequelize({
    database: index_1.config.db.name,
    username: index_1.config.db.user,
    password: index_1.config.db.password,
    host: index_1.config.db.host,
    port: index_1.config.db.port,
    dialect: 'postgres',
    logging: (msg) => logger_1.logger.debug(msg),
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
exports.sequelize = sequelize;
const connectDatabase = async () => {
    try {
        await sequelize.authenticate();
        logger_1.logger.info('Database connection established successfully');
        // Sync models (development only)
        await sequelize.sync({ alter: true });
        logger_1.logger.info('Database models synchronized');
    }
    catch (error) {
        logger_1.logger.error('Unable to connect to database:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
exports.default = sequelize;
//# sourceMappingURL=database.js.map