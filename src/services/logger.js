import winston from 'winston';
import { resolve } from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: resolve(process.cwd(), './logs', 'seo-ranker-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: 7,
      level: logLevel,
    }),
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

export default logger;
