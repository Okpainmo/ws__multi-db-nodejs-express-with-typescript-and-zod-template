import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage, Server as HTTPServer } from 'http';
import { randomUUID } from 'crypto';
import log from '../../utils/logger.js';

import type { MessageHandler, ConnectionHandler, CloseHandler, ErrorHandler, ExtendedWebSocket } from './types.js';

import { generateConnectionId } from './utils/generateConnectionId.js';
import { safeSendMessage, parseMessage } from './utils/messageHandler.js';
import { safeCloseSocket } from './utils/connectionHandler.js';
import { broadcastMessage } from './utils/messaging.js';
import { registerConnection, unregisterConnection, activeConnections } from './utils/connectionRegistry.js';
import { setupHeartbeat } from './utils/heartbeat.js';
import { isSocketClosing } from './utils/socketStatus.js';

/**
 * Create and configure a WebSocket server
 */
export function createWebSocketServer(
  httpServer: HTTPServer,
  options?: {
    path?: string;
    heartbeatInterval?: number;
    onConnection?: ConnectionHandler;
    onMessage?: MessageHandler;
    onClose?: CloseHandler;
    onError?: ErrorHandler;
  }
): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: options?.path || '/ws'
  });

  wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
    const extendedWs = ws as ExtendedWebSocket;

    extendedWs.id = generateConnectionId();
    // Ensure a request-scoped correlation ID for the connection
    extendedWs.requestId = (request.headers['x-request-id'] as string) || randomUUID();
    extendedWs.isAlive = true;
    extendedWs.lastActivity = new Date();
    extendedWs.metadata = {
      connectedAt: new Date(),
      userAgent: request.headers['user-agent'],
      remoteAddress: request.socket.remoteAddress
    };

    // Log connection attempt (Handshake)
    const method = request.method;
    const url = request.url;
    // log.info('...................................');
    log.info({ level: 'info', requestId: extendedWs.requestId }, `WebSocket Handshake started: ${method} ${url}`);

    registerConnection(extendedWs);

    // Log connection established
    log.info(
      {
        level: 'info',
        requestId: extendedWs.requestId,
        connectionId: extendedWs.id,
        remoteAddress: request.socket.remoteAddress,
        userAgent: request.headers['user-agent'],
        env: process.env.NODE_ENV
      },
      'WebSocket Session Established'
    );

    if (options?.heartbeatInterval !== 0) {
      setupHeartbeat(extendedWs, options?.heartbeatInterval);
    }

    if (options?.onConnection) {
      try {
        await options.onConnection(extendedWs, request);
      } catch (error) {
        log.error({ level: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, 'Error in connection handler');
      }
    }

    extendedWs.on('message', async (data) => {
      const msgStartTime = Date.now();
      extendedWs.lastActivity = new Date();

      const message = parseMessage(data);
      const msgType = message?.type || 'unknown';

      if (!message) {
        safeSendMessage(extendedWs, {
          type: 'error',
          payload: { message: 'Invalid message format' }
        });
        return;
      }

      try {
        if (options?.onMessage) {
          await options.onMessage(extendedWs, message);
        }
      } catch (error) {
        log.error(
          {
            level: 'error',
            requestId: extendedWs.requestId,
            connectionId: extendedWs.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          'Error in message handler'
        );
        safeSendMessage(extendedWs, {
          type: 'error',
          payload: { message: 'Error processing message' }
        });
      } finally {
        const duration = Date.now() - msgStartTime;

        log.info(
          {
            level: 'info',
            requestId: extendedWs.requestId,
            connectionId: extendedWs.id,
            type: 'WS_MESSAGE',
            messageType: msgType,
            duration: `${duration}ms`,
            status: 'processed'
          },
          `WS Message finished: ${msgType}`
        );
      }
    });

    extendedWs.on('close', async (code, reason) => {
      const sessionDuration = Date.now() - (extendedWs.metadata?.connectedAt as Date).getTime();

      log.info(
        {
          level: 'info',
          requestId: extendedWs.requestId,
          connectionId: extendedWs.id,
          duration: `${sessionDuration}ms`,
          code,
          reason: reason.toString()
        },
        'WebSocket Session Ended'
      );
      // log.info('...................................');

      if (options?.onClose) {
        try {
          await options.onClose(extendedWs, code, reason);
        } catch (error) {
          log.error({ level: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, 'Error in close handler');
        }
      }

      unregisterConnection(extendedWs.id);
    });

    extendedWs.on('error', async (error) => {
      log.error({ level: 'error', connectionId: extendedWs.id, error: error.message }, 'WebSocket error');

      if (options?.onError) {
        try {
          await options.onError(extendedWs, error);
        } catch (handlerError) {
          log.error({ level: 'error', error: handlerError instanceof Error ? handlerError.message : 'Unknown error' }, 'Error in error handler');
        }
      }

      safeCloseSocket(extendedWs, 1011, 'Internal error');
    });

    safeSendMessage(extendedWs, {
      type: 'connected',
      payload: {
        connectionId: extendedWs.id,
        timestamp: Date.now()
      }
    });
  };);

  return wss;
}

/**
 * Gracefully shutdown WebSocket server
 */
export async function shutdownWebSocketServer(wss: WebSocketServer, timeout = 10000): Promise<void> {
  log.info({ level: 'info' }, 'Initiating WebSocket server shutdown...');

  broadcastMessage({
    type: 'server_shutdown',
    payload: { message: 'Server is shutting down' }
  });

  const closePromises: Promise<void>[] = [];

  activeConnections.forEach((ws) => {
    closePromises.push(
      new Promise((resolve) => {
        if (isSocketClosing(ws)) {
          resolve();
          return;
        }

        ws.once('close', resolve);
        safeCloseSocket(ws, 1001, 'Server shutdown');

        setTimeout(() => {
          if (!isSocketClosing(ws)) {
            ws.terminate();
          }
          resolve();
        }, timeout);
      })
    );
  });

  await Promise.all(closePromises);

  return new Promise((resolve, reject) => {
    wss.close((error) => {
      if (error) {
        log.error({ level: 'error', error: error.message }, 'Error closing WebSocket server');
        reject(error);
      } else {
        log.info({ level: 'info' }, 'WebSocket server shutdown complete');
        resolve();
      }
    });
  });
}
