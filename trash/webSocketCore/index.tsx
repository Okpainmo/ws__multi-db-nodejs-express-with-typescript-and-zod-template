// Study this, and remove redundant code:

// import { WebSocket, WebSocketServer } from 'ws';
// import { IncomingMessage, Server as HTTPServer } from 'http';
// import log from '../../utils/logger.js';
// import { WebSocketState } from './types.js';
// import type { MessageHandler, ConnectionHandler, CloseHandler, ErrorHandler, ExtendedWebSocket } from './types.js';

// // Import utilities
// import { generateConnectionId } from './utils/connectionId.js';
// import { isSocketOpen, isSocketClosing, isSocketInState } from './utils/socketStatus.js';
// import { safeSendMessage, parseMessage } from './utils/messageHandler.js';
// import { safeCloseSocket } from './utils/connectionHandler.js';
// import { broadcastMessage, sendToUser, sendToConnection } from './utils/messaging.js';
// import {
//   registerConnection,
//   unregisterConnection,
//   getConnectionMetadata,
//   getActiveConnectionIds,
//   getConnectionCount,
//   getUserConnectionCount,
//   isUserConnected,
//   activeConnections
// } from './utils/connectionRegistry.js';
// import { setupHeartbeat } from './utils/heartbeat.js';
// import { handleStateTransition } from './utils/lifecycle.js';

// /**
//  * Create and configure a WebSocket server
//  */
// export function createWebSocketServer(
//   httpServer: HTTPServer,
//   options?: {
//     path?: string;
//     heartbeatInterval?: number;
//     onConnection?: ConnectionHandler;
//     onMessage?: MessageHandler;
//     onClose?: CloseHandler;
//     onError?: ErrorHandler;
//   }
// ): WebSocketServer {
//   const wss = new WebSocketServer({
//     server: httpServer,
//     path: options?.path || '/ws'
//   });

//   wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
//     const extendedWs = ws as ExtendedWebSocket;

//     // Initialize extended properties
//     extendedWs.id = generateConnectionId();
//     extendedWs.isAlive = true;
//     extendedWs.lastActivity = new Date();
//     extendedWs.metadata = {
//       connectedAt: new Date(),
//       userAgent: request.headers['user-agent'],
//       remoteAddress: request.socket.remoteAddress
//     };

//     log.info(`New WebSocket connection - ID: ${extendedWs.id}, IP: ${request.socket.remoteAddress}`);

//     // Register the connection
//     registerConnection(extendedWs);

//     // Setup heartbeat
//     if (options?.heartbeatInterval !== 0) {
//       setupHeartbeat(extendedWs, options?.heartbeatInterval);
//     }

//     // Handle connection
//     if (options?.onConnection) {
//       try {
//         await options.onConnection(extendedWs, request);
//       } catch (error) {
//         log.error(`Error in connection handler: ${error instanceof Error ? error.message : 'Unknown error'}`);
//       }
//     }

//     // Handle messages
//     extendedWs.on('message', async (data) => {
//       extendedWs.lastActivity = new Date();

//       const message = parseMessage(data);
//       if (!message) {
//         safeSendMessage(extendedWs, {
//           type: 'error',
//           payload: { message: 'Invalid message format' }
//         });
//         return;
//       }

//       if (options?.onMessage) {
//         try {
//           await options.onMessage(extendedWs, message);
//         } catch (error) {
//           log.error(`Error in message handler: ${error instanceof Error ? error.message : 'Unknown error'}`);
//           safeSendMessage(extendedWs, {
//             type: 'error',
//             payload: { message: 'Error processing message' }
//           });
//         }
//       }
//     });

//     // Handle close
//     extendedWs.on('close', async (code, reason) => {
//       log.info(`WebSocket closed - ID: ${extendedWs.id}, Code: ${code}, Reason: ${reason.toString()}`);

//       if (options?.onClose) {
//         try {
//           await options.onClose(extendedWs, code, reason);
//         } catch (error) {
//           log.error(`Error in close handler: ${error instanceof Error ? error.message : 'Unknown error'}`);
//         }
//       }

//       unregisterConnection(extendedWs.id);
//     });

//     // Handle errors
//     extendedWs.on('error', async (error) => {
//       log.error(`WebSocket error - ID: ${extendedWs.id}, Error: ${error.message}`);

//       if (options?.onError) {
//         try {
//           await options.onError(extendedWs, error);
//         } catch (handlerError) {
//           log.error(`Error in error handler: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}`);
//         }
//       }

//       // Close the connection if there's an error
//       safeCloseSocket(extendedWs, 1011, 'Internal error');
//     });

//     // Send welcome message
//     safeSendMessage(extendedWs, {
//       type: 'connected',
//       payload: {
//         connectionId: extendedWs.id,
//         timestamp: Date.now()
//       }
//     });
//   });

//   return wss;
// }

// /**
//  * Gracefully shutdown WebSocket server
//  */
// export async function shutdownWebSocketServer(wss: WebSocketServer, timeout: number = 10000): Promise<void> {
//   log.info('Initiating WebSocket server shutdown...');

//   // Notify all clients
//   broadcastMessage({
//     type: 'server_shutdown',
//     payload: { message: 'Server is shutting down' }
//   });

//   // Close all connections
//   const closePromises: Promise<void>[] = [];

//   activeConnections.forEach((ws) => {
//     closePromises.push(
//       new Promise((resolve) => {
//         if (isSocketClosing(ws)) {
//           resolve();
//           return;
//         }

//         ws.once('close', () => resolve());
//         safeCloseSocket(ws, 1001, 'Server shutdown');

//         // Force close after timeout
//         setTimeout(() => {
//           if (!isSocketClosing(ws)) {
//             ws.terminate();
//           }
//           resolve();
//         }, timeout);
//       })
//     );
//   });

//   await Promise.all(closePromises);

//   // Close the server
//   return new Promise((resolve, reject) => {
//     wss.close((error) => {
//       if (error) {
//         log.error(`Error closing WebSocket server: ${error.message}`);
//         reject(error);
//       } else {
//         log.info('WebSocket server shutdown complete');
//         resolve();
//       }
//     });
//   });
// }

// // Re-export everything for convenience
// export {
//   WebSocketState,
//   generateConnectionId,
//   isSocketInState,
//   isSocketOpen,
//   isSocketClosing,
//   safeSendMessage,
//   safeCloseSocket,
//   broadcastMessage,
//   sendToUser,
//   sendToConnection,
//   registerConnection,
//   unregisterConnection,
//   getConnectionMetadata,
//   getActiveConnectionIds,
//   getConnectionCount,
//   getUserConnectionCount,
//   isUserConnected,
//   setupHeartbeat,
//   parseMessage,
//   handleStateTransition
// };

// // Re-export types
// export type {
//   ConnectionMetadata,
//   WebSocketMessage,
//   ExtendedWebSocket,
//   MessageHandler,
//   ConnectionHandler,
//   CloseHandler,
//   ErrorHandler
// } from './types.js';

// export default {
//   WebSocketState,
//   generateConnectionId,
//   isSocketInState,
//   isSocketOpen,
//   isSocketClosing,
//   safeSendMessage,
//   safeCloseSocket,
//   broadcastMessage,
//   sendToUser,
//   sendToConnection,
//   registerConnection,
//   unregisterConnection,
//   getConnectionMetadata,
//   getActiveConnectionIds,
//   getConnectionCount,
//   getUserConnectionCount,
//   isUserConnected,
//   setupHeartbeat,
//   parseMessage,
//   handleStateTransition,
//   createWebSocketServer,
//   shutdownWebSocketServer
// };
