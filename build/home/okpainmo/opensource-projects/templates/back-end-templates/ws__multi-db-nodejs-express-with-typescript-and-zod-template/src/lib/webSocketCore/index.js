import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage, Server as HTTPServer } from 'http';
import log from '../../utils/logger.js';
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
export function createWebSocketServer(httpServer, options) {
    const wss = new WebSocketServer({
        server: httpServer,
        path: options?.path || '/ws'
    });
    wss.on('connection', async (ws, request) => {
        const extendedWs = ws;
        extendedWs.id = generateConnectionId();
        extendedWs.isAlive = true;
        extendedWs.lastActivity = new Date();
        extendedWs.metadata = {
            connectedAt: new Date(),
            userAgent: request.headers['user-agent'],
            remoteAddress: request.socket.remoteAddress
        };
        log.info(`New WebSocket connection - ID: ${extendedWs.id}, IP: ${request.socket.remoteAddress}`);
        registerConnection(extendedWs);
        if (options?.heartbeatInterval !== 0) {
            setupHeartbeat(extendedWs, options?.heartbeatInterval);
        }
        if (options?.onConnection) {
            try {
                await options.onConnection(extendedWs, request);
            }
            catch (error) {
                log.error(`Error in connection handler: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        extendedWs.on('message', async (data) => {
            extendedWs.lastActivity = new Date();
            const message = parseMessage(data);
            if (!message) {
                safeSendMessage(extendedWs, {
                    type: 'error',
                    payload: { message: 'Invalid message format' }
                });
                return;
            }
            if (options?.onMessage) {
                try {
                    await options.onMessage(extendedWs, message);
                }
                catch (error) {
                    log.error(`Error in message handler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    safeSendMessage(extendedWs, {
                        type: 'error',
                        payload: { message: 'Error processing message' }
                    });
                }
            }
        });
        extendedWs.on('close', async (code, reason) => {
            log.info(`WebSocket closed - ID: ${extendedWs.id}, Code: ${code}, Reason: ${reason.toString()}`);
            if (options?.onClose) {
                try {
                    await options.onClose(extendedWs, code, reason);
                }
                catch (error) {
                    log.error(`Error in close handler: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
            unregisterConnection(extendedWs.id);
        });
        extendedWs.on('error', async (error) => {
            log.error(`WebSocket error - ID: ${extendedWs.id}, Error: ${error.message}`);
            if (options?.onError) {
                try {
                    await options.onError(extendedWs, error);
                }
                catch (handlerError) {
                    log.error(`Error in error handler: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}`);
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
    });
    return wss;
}
/**
 * Gracefully shutdown WebSocket server
 */
export async function shutdownWebSocketServer(wss, timeout = 10000) {
    log.info('Initiating WebSocket server shutdown...');
    broadcastMessage({
        type: 'server_shutdown',
        payload: { message: 'Server is shutting down' }
    });
    const closePromises = [];
    activeConnections.forEach((ws) => {
        closePromises.push(new Promise((resolve) => {
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
        }));
    });
    await Promise.all(closePromises);
    return new Promise((resolve, reject) => {
        wss.close((error) => {
            if (error) {
                log.error(`Error closing WebSocket server: ${error.message}`);
                reject(error);
            }
            else {
                log.info('WebSocket server shutdown complete');
                resolve();
            }
        });
    });
}
