import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import ResponceFormatter from "./shared/utils/ResponceFormatter.js";
import cors from "cors";
import logger from "./shared/config/logger.js";
import errorHandler from "./shared/middlewares/errorHandler.js";
import mongodb from "./shared/config/mongodb.js";
import rabbitmq from "./shared/config/rabbitmq.js";
import postgres from "./shared/config/postgres.js";
import config from "./shared/config/index.js";

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"), //browser info
  });
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json(
    ResponceFormatter.sucess(
      {
        status: "healthy",
        timeStamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      "service is healthy",
    ),
  );
});

app.get("/", (req, res) => {
  res.status(200).json(
    ResponceFormatter.sucess({
      service: "Api Monitoring Service",
      version: "1.0.0",
      endpoints: [
        {
          health: "/health",
          auth: "/api/auth",
          ingest: "api/hit",
          analytics: "api/analytics",
        },
      ],
      description: "API HIT MONITORING SERVICE",
    }),
  );
});

app.use((req, res) => {
  res.status(404).json(ResponceFormatter.error("Endpoints not found ", 404));
});

//if only error comes this middleware will handle it and send the response to the client
app.use(errorHandler);

async function initilizeConnections() {
  try {
    logger.info("Connecting to MongoDB...");

    //connect to mongodb
    await mongodb.connect();
    logger.info("Connected to MongoDb");
    // console.log("Connected to MongoDb");

    //connect to postgres
    await postgres.connect();
    logger.info("Connected to Postgres");
    // console.log("Connected to Postgres");

    //connect to the rabbitmq
    await rabbitmq.connect();
    logger.info("Connected to Rabbitmq");
    // console.log("Connected to Rabbitmq");

    logger.info("All Connections Are Established successfully");
    // console.log("All Connections Are Established successfully");
  } catch (error) {
    logger.error("Failed to initializing connections", error);
    throw error;
  }
}

async function startServer() {
  try {

    const server = app.listen(config.port, () => {
      logger.info(`server started on port ${config.port}`);
      logger.info(`Environment:${config.node_env}`);
      logger.info(`API available at :http://localhost:${config.port}`);
      // console.log(`server started on port ${config.port}`);
    });
    
     await initilizeConnections();

    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. shut down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed successfully");
        await rabbitmq.close();
        logger.info("Rabbitmq connection closed successfully");
        await mongodb.disconnect();
        logger.info("MongoDB connection closed successfully");
        await postgres.close();
        logger.info("Postgres connection closed successfully");
        process.exit(0);
      });
      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down",
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);

    //Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
