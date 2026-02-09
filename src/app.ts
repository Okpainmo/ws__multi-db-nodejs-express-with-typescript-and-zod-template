import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { URL } from 'url';
import { createServer } from 'http';
import { createWebSocketServer, shutdownWebSocketServer } from './lib/webSocketCore/index.js';
// DB imports
import connectMongoDb from './db/connect-mongodb.js';
import connectPostgres from './db/connect-postgres.js';
import log from './utils/logger.js';
// routes imports
import userRouter from './domains/user/router/user.router.js';
import authRouter from './domains/auth/router/auth.router.js';
import adminRouter from './domains/admin/router/admin.router.js';

// middleware imports
import { requestLogger } from './middlewares/requestLogger.middleware.js';

import { serverConfig, dbConfig, wsConfig } from './config/index.js';

// dependency inits
const app = express();

const allowedOrigins =
  serverConfig.env === 'production' ? ['https://mydomain.com'] : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'email']
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add request duration logging middleware
app.use(requestLogger);

app.get('/', (_req: Request, res: Response) => {
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

    const selectedDbs = dbConfig.requiredTypes;

    if (selectedDbs.includes('mongodb')) {
      const mongoDbConnection = await connectMongoDb(dbConfig.mongodb.uri);
      if (mongoDbConnection) {
        log.info(
          `...................................\nConnected to: ${mongoDbConnection?.connection.host}\nEnvironment: ${serverConfig.env}
        \nMongoDB connected successfully \n.........................................................................`
        );
      }
    }

    if (selectedDbs.includes('postgresql')) {
      await connectPostgres();
      const parsedUrl = new URL(dbConfig.postgresql.url as string);
      log.info(
        `...................................\nConnected to: ${parsedUrl.hostname}\nEnvironment: ${serverConfig.env}
          \nPostgreSQL connected successfully \n.........................................................................`
      );
    }

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket server
    const wss = createWebSocketServer(httpServer, {
      path: wsConfig.path,
      heartbeatInterval: wsConfig.heartbeatInterval,

      onConnection: async (ws, request) => {
        log.info({ level: 'info', remoteAddress: request.socket.remoteAddress }, 'WebSocket client connected');

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: 'welcome',
            payload: {
              message: 'Connected to Multi-DB Server WebSocket',
              connectionId: ws.id,
              timestamp: Date.now()
            }
          })
        );
      },

      onMessage: async (ws, message) => {
        log.info({ level: 'info', messageType: message.type, connectionId: ws.id }, 'Received WebSocket message');

        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

          case 'echo':
            ws.send(
              JSON.stringify({
                type: 'echo_response',
                payload: message.payload,
                timestamp: Date.now()
              })
            );
            break;

          default:
            log.warn({ level: 'warn', messageType: message.type }, 'Unhandled message type');
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: `Unknown message type: ${message.type}` }
              })
            );
        }
      },

      onClose: async (ws, code, reason) => {
        log.info({ level: 'info', connectionId: ws.id, code, reason: reason.toString() }, 'WebSocket connection closed');
      },

      onError: async (ws, error) => {
        log.error({ level: 'error', connectionId: ws.id, error: error.message }, 'WebSocket error');
      }
    });

    // Start server
    httpServer.listen(port, () => {
      log.info(
        `...................................\nWebSocket server is listening on port ${port}\nWebSocket: ws://localhost:${port}/ws\n\nHTTP server is listening on port ${port}\nHTTP: http://localhost:${port}\n\nEnvironment: ${
          process.env.DEPLOY_ENV ? process.env.DEPLOY_ENV : 'development'
        }\n.........................................................................`
      );
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      log.info({ level: 'info', signal }, 'Signal received: closing server gracefully');

      try {
        // Shutdown WebSocket server first
        await shutdownWebSocketServer(wss, wsConfig.shutdownTimeout);

        // Close HTTP server
        httpServer.close(() => {
          log.info({ level: 'info' }, 'HTTP server closed');
          process.exit(0);
        });

        // Force exit after timeout
        setTimeout(() => {
          log.error({ level: 'error' }, 'Forced shutdown after timeout');
          process.exit(1);
        }, 15000);
      } catch (error) {
        log.error({ level: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    if (error instanceof Error) {
      log.error({ level: 'error', error: error.message }, 'Error occurred');
    }
    process.exit(1);
  }
};

start();
