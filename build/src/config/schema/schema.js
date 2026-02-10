import { z } from 'zod';
export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    // Database Preference
    DATABASE_TYPE: z
        .string()
        .default('mongodb')
        .transform((val) => val.split(',').map((s) => s.trim().toLowerCase())),
    // Domain Database Preferences
    DATABASE_TYPE_ADMIN: z.enum(['mongodb', 'postgresql']).default('postgresql'),
    DATABASE_TYPE_AUTH: z.enum(['mongodb', 'postgresql']).default('mongodb'),
    DATABASE_TYPE_USER: z.enum(['mongodb', 'postgresql']).default('mongodb'),
    DATABASE_TYPE_LOGS: z.enum(['mongodb', 'postgresql']).default('mongodb'),
    // MongoDB
    MONGO_DATABASE_NAME: z.string().optional(),
    MONGO_DB_URI: z.string().url().optional(),
    // PostgreSQL
    POSTGRES_USER: z.string().optional(),
    POSTGRES_PASSWORD: z.string().optional(),
    POSTGRES_DATABASE_NAME: z.string().optional(),
    POSTGRES_DATABASE_URL: z.string().url().optional(),
    // JWT
    JWT_SECRET: z.string().min(8),
    JWT_ACCESS_EXPIRATION_TIME: z.string().default('1h'),
    JWT_SESSION_EXPIRATION_TIME: z.string().default('24h'),
    JWT_ONE_TIME_PASSWORD_LIFETIME: z.string().default('5m'),
    // WebSockets
    WS_PATH: z.string().startsWith('/').default('/ws'),
    WS_HEARTBEAT_INTERVAL: z.coerce.number().default(30000),
    WS_SHUTDOWN_TIMEOUT: z.coerce.number().default(10000),
    // Service Details
    SERVICE_NAME: z.string().optional()
});
