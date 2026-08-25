import winston from "winston";
import config from "./index.js";

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const transports = [
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/combined.log" }), //without error level saved in combine.log
];

const consoleFormate = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
);

const logger = winston.createLogger({
  level: config.node_env == "production" ? "info" : "debug",
  format,
  defaultMeta: { service: "api-monitoring-service" },
  transports,

  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],

  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

if (config.node_env !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormate,
    }),
  );
}

export default logger;
