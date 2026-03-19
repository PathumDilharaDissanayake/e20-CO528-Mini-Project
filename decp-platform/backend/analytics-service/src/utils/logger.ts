import winston from 'winston';
const { combine, timestamp, printf, colorize, errors } = winston.format;
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [ANALYTICS-SERVICE] [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) msg += ` ${JSON.stringify(metadata)}`;
  if (stack) msg += `\n${stack}`;
  return msg;
});
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true })),
  transports: [
    new winston.transports.Console({ format: combine(colorize(), logFormat) }),
    new winston.transports.File({ filename: 'logs/analytics-error.log', level: 'error', format: logFormat }),
    new winston.transports.File({ filename: 'logs/analytics-combined.log', format: logFormat })
  ]
});
export default logger;
