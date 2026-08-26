import 'dotenv/config';

const mongoHost = process.env.MONGO_HOST || "localhost";
const mongoPort = parseInt(process.env.MONGO_PORT, 10) || 27017;
const mongoDbName = process.env.MONGO_DB_NAME || "api-monitor";
const mongoUser = process.env.MONGO_ROOT_USERNAME;
const mongoPassword = process.env.MONGO_ROOT_PASSWORD;
const mongoAuthSource = process.env.MONGO_AUTH_SOURCE || "admin";
const hasMongoCredentials = Boolean(mongoUser && mongoPassword);

const computedMongoUri = hasMongoCredentials
    ? `mongodb://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${mongoHost}:${mongoPort}/${mongoDbName}?authSource=${mongoAuthSource}`
    : `mongodb://${mongoHost}:${mongoPort}/${mongoDbName}`;

const config = {

    node_env: process.env.NODE_ENV || 'development',
    // Docker provides PORT; local .env files commonly use API_PORT.
    port: parseInt(process.env.PORT ?? process.env.API_PORT, 10) || 5000,

    mongo:{
        uri: process.env.MONGO_URI || computedMongoUri,
        dbName: mongoDbName,
    },

    postgres:{
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'ayush',
        database: process.env.POSTGRES_DB || 'api_monitoring',
    },

    rabbitmq:{
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        queue: process.env.RABBITMQ_QUEUE || 'api_monitoring_queue',
        publisherConfirms: process.env.RABBITMQ_PUBLISHER_CONFIRMS === 'true' || false,
        retryAttempts:parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS, 10) || 3,
        retryDelay:parseInt(process.env.RABBITMQ_RETRY_DELAY, 10) || 1000,
    },

    jwt:{
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },

    ratelimit:{
        windows:parseInt(process.env.RATELIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
        max:parseInt(process.env.RATELIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
    },

    cookie:{
        httpOnly: process.env.COOKIE_HTTP_ONLY === 'true' || true,
        secure: process.env.COOKIE_SECURE === 'true' || false,
        expires: parseInt(process.env.COOKIE_EXPIRES, 10) || 24 * 60 * 60 * 1000, // 1 day
    }
    
};

export default config;
