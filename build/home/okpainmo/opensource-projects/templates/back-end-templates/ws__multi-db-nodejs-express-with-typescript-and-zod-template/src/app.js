import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import log from './utils/logger.js';
import { URL } from 'url';
import { createServer } from 'http';
import { createWebSocketServer, shutdownWebSocketServer } from './lib/webSocketCore/index.js';
// DB imports
import connectMongoDb from './db/connect-mongodb.js';
import connectPostgres from './db/connect-postgres.js';
// routes imports
import userRouter from './domains/user/router/user.router.js';
import authRouter from './domains/auth/router/auth.router.js';
import adminRouter from './domains/admin/router/admin.router.js';
// middleware imports
import { requestDurationLogging } from './middlewares/requestDurationLogging.middleware.js';
// dependency inits
const app = express();
import { serverConfig, dbConfig, wsConfig } from './config/index.js';
const allowedOrigins = serverConfig.env === 'production' ? ['https://mydomain.com'] : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
    credentials: true,
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'email']
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Add request duration logging middleware
app.use(requestDurationLogging);
app.get('/', (_req, res) => {
    res.status(200).send({
        responseMessage: 'Welcome to the Multi DB Node/Express... server',
        response: {
            apiStatus: 'OK - Server is live'
        }
    });
});
// user end-points - all routed
app.use(`/api/v1/user`, userRouter);
app.use(`/api/v1/auth`, authRouter);
app.use(`/api/v1/admin`, adminRouter);
const port = serverConfig.port;
const start = async () => {
    try {
        log.info(`Establishing database connection(s)`);
        if (dbConfig.type === 'mongodb') {
            const mongoDbConnection = await connectMongoDb(dbConfig.mongodb.uri);
            if (mongoDbConnection) {
                log.info(`...................................\nConnected to: ${mongoDbConnection?.connection.host}\nEnvironment: ${serverConfig.env}
        \nMongoDB connected successfully \n........................................................`);
            }
        }
        else if (dbConfig.type === 'postgresql') {
            await connectPostgres();
            const parsedUrl = new URL(dbConfig.postgresql.url);
            log.info(`...................................\nConnected to: ${parsedUrl.hostname}\nEnvironment: ${serverConfig.env}
          \nPostgreSQL connected successfully \n........................................................`);
        }
        // Create HTTP server
        const httpServer = createServer(app);
        // Initialize WebSocket server
        const wss = createWebSocketServer(httpServer, {
            path: wsConfig.path,
            heartbeatInterval: wsConfig.heartbeatInterval,
            onConnection: async (ws, request) => {
                log.info(`WebSocket client connected from ${request.socket.remoteAddress}`);
                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'welcome',
                    payload: {
                        message: 'Connected to Multi-DB Server WebSocket',
                        connectionId: ws.id,
                        timestamp: Date.now()
                    }
                }));
            },
            onMessage: async (ws, message) => {
                log.info(`Received WebSocket message - Type: ${message.type}, Connection: ${ws.id}`);
                switch (message.type) {
                    case 'ping':
                        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                        break;
                    case 'echo':
                        ws.send(JSON.stringify({
                            type: 'echo_response',
                            payload: message.payload,
                            timestamp: Date.now()
                        }));
                        break;
                    default:
                        log.warn(`Unhandled message type: ${message.type}`);
                        ws.send(JSON.stringify({
                            type: 'error',
                            payload: { message: `Unknown message type: ${message.type}` }
                        }));
                }
            },
            onClose: async (ws, code, reason) => {
                log.info(`WebSocket connection closed - ID: ${ws.id}, Code: ${code}, Reason: ${reason.toString()}`);
            },
            onError: async (ws, error) => {
                log.error(`WebSocket error - ID: ${ws.id}, Error: ${error.message}`);
            }
        });
        // Start server
        httpServer.listen(port, () => {
            log.info(`...................................\nWebSocket server is listening on port ${port}\nWebSocket: ws://localhost:${port}/ws\n\nHTTP server is listening on port ${port}\nHTTP: http://localhost:${port}\n\nEnvironment: ${process.env.DEPLOY_ENV ? process.env.DEPLOY_ENV : 'development'}\n........................................................`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            log.info(`${signal} signal received: closing server gracefully`);
            try {
                // Shutdown WebSocket server first
                await shutdownWebSocketServer(wss, wsConfig.shutdownTimeout);
                // Close HTTP server
                httpServer.close(() => {
                    log.info('HTTP server closed');
                    process.exit(0);
                });
                // Force exit after timeout
                setTimeout(() => {
                    log.error('Forced shutdown after timeout');
                    process.exit(1);
                }, 15000);
            }
            catch (error) {
                log.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        if (error instanceof Error) {
            log.error(error.message);
        }
        process.exit(1);
    }
};
start();
