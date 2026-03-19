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
const ensureDatabaseExists = async () => {
    const adminSequelize = new sequelize_1.Sequelize({
        database: 'postgres',
        username: index_1.config.db.user,
        password: index_1.config.db.password,
        host: index_1.config.db.host,
        port: index_1.config.db.port,
        dialect: 'postgres',
        logging: false,
        ...(useSsl
            ? { dialectOptions: { ssl: { require: true, rejectUnauthorized } } }
            : {}),
    });
    try {
        const result = await adminSequelize.query('SELECT 1 FROM pg_database WHERE datname = $1', { bind: [index_1.config.db.name], type: sequelize_1.QueryTypes.SELECT });
        if (result.length === 0) {
            await adminSequelize.query(`CREATE DATABASE "${index_1.config.db.name}"`);
            logger_1.logger.info(`Database "${index_1.config.db.name}" created successfully`);
        }
    }
    finally {
        await adminSequelize.close();
    }
};
const connectDatabase = async () => {
    try {
        await sequelize.authenticate();
    }
    catch (error) {
        if (error?.original?.code === '3D000') {
            logger_1.logger.info(`Database "${index_1.config.db.name}" does not exist, creating...`);
            await ensureDatabaseExists();
            await sequelize.authenticate();
        }
        else {
            throw error;
        }
    }
    logger_1.logger.info('Database connection established successfully');
    await sequelize.sync({ alter: true });
    logger_1.logger.info('Database models synchronized');
};
exports.connectDatabase = connectDatabase;
exports.default = sequelize;
//# sourceMappingURL=database.js.map