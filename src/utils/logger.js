const winston = require('winston');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define which transports to use
const transports = [
    // Console transport (always enabled)
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}`
            )
        ),
    }),
    // File transport for errors (production)
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }),
    // File transport for all logs (production)
    new winston.transports.File({
        filename: 'logs/combined.log',
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format,
    transports,
});

module.exports = logger;
