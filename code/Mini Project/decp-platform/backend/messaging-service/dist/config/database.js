"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.connectDatabase = void 0;
const sequelize_1 = require("sequelize");
const index_1 = require("./index");
const logger_1 = require("../utils/logger");
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
    }
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
