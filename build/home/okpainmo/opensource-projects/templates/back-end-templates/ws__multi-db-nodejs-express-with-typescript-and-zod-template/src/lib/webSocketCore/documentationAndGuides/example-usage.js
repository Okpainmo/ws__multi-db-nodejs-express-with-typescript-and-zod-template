/**
 * Example usage of WebSocket Core utilities
 *
 * This file demonstrates how to integrate the WebSocket server with your Express app
 * and handle various WebSocket operations.
 */
import { Server as HTTPServer } from 'http';
import { createWebSocketServer, shutdownWebSocketServer } from '../index.js';
import { isUserConnected, getConnectionCount } from '../utils/connectionRegistry.js';
import { sendToUser, broadcastMessage } from '../utils/messaging.js';
import log from '../../../utils/logger.js';
// Example: Create WebSocket server with custom handlers
export function initializeWebSocketServer(httpServer) {
    const wss = createWebSocketServer(httpServer, {
        path: '/ws',
        heartbeatInterval: 30000, // 30 seconds
        // Handle new connections
        onConnection: async (_ws, request) => {
            log.info(`Client connected from ${request.socket.remoteAddress}`);
            // You can extract userId from query params, headers, or auth token
            // Example: const userId = extractUserIdFromRequest(request);
            // if (userId) {
            //   ws.userId = userId;
            //   registerConnection(ws, userId);
            // }
        },
        // Handle incoming messages
        onMessage: async (ws, message) => {
            log.info(`Received message from ${ws.id}: ${message.type}`);
            switch (message.type) {
                case 'authenticate':
                    // Handle authentication
                    handleAuthentication(ws, message.payload);
                    break;
                case 'chat':
                    // Handle chat message
                    handleChatMessage(ws, message.payload);
                    break;
                case 'ping':
                    // Respond to ping
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;
                default:
                    log.warn(`Unknown message type: ${message.type}`);
                    ws.send(JSON.stringify({
                        type: 'error',
                        payload: { message: `Unknown message type: ${message.type}` }
                    }));
            }
        },
        // Handle connection close
        onClose: async (ws, code, reason) => {
            log.info(`Connection ${ws.id} closed - Code: ${code}, Reason: ${reason.toString()}`);
            if (ws.userId) {
                // Notify other users that this user disconnected
                broadcastMessage({
                    type: 'user_disconnected',
                    payload: { userId: ws.userId }
                }, ws.id);
            }
        },
        // Handle errors
        onError: async (ws, error) => {
            log.error(`WebSocket error for connection ${ws.id}: ${error.message}`);
        }
    });
    // Log connection count periodically
    setInterval(() => {
        log.info(`Active WebSocket connections: ${getConnectionCount()}`);
    }, 60000); // Every minute
    return wss;
}
// Example: Handle user authentication
function handleAuthentication(ws, payload) {
    try {
        // Validate and extract userId from payload
        // const { token } = payload as { token: string };
        // const userId = verifyTokenAndGetUserId(token);
        const userId = payload.userId; // Simplified example
        if (!userId) {
            ws.send(JSON.stringify({
                type: 'auth_error',
                payload: { message: 'Invalid authentication' }
            }));
            return;
        }
        ws.userId = userId;
        ws.send(JSON.stringify({
            type: 'authenticated',
            payload: { userId, connectionId: ws.id }
        }));
        log.info(`User ${userId} authenticated on connection ${ws.id}`);
    }
    catch (error) {
        log.error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        ws.send(JSON.stringify({
            type: 'auth_error',
            payload: { message: 'Authentication failed' }
        }));
    }
}
// Example: Handle chat message
function handleChatMessage(ws, payload) {
    try {
        const { recipientId, message } = payload;
        if (!ws.userId) {
            ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Not authenticated' }
            }));
            return;
        }
        // Check if recipient is connected
        if (!isUserConnected(recipientId)) {
            ws.send(JSON.stringify({
                type: 'delivery_failed',
                payload: { message: 'Recipient not connected' }
            }));
            return;
        }
        // Send message to recipient
        const sent = sendToUser(recipientId, {
            type: 'chat',
            payload: {
                from: ws.userId,
                message,
                timestamp: Date.now()
            }
        });
        // Send confirmation to sender
        ws.send(JSON.stringify({
            type: 'message_sent',
            payload: { success: sent, recipientId }
        }));
    }
    catch (error) {
        log.error(`Error handling chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        ws.send(JSON.stringify({
            type: 'error',
            payload: { message: 'Failed to send message' }
        }));
    }
}
// Example: Graceful shutdown
export async function gracefulShutdown(wss) {
    log.info('Starting graceful shutdown...');
    try {
        await shutdownWebSocketServer(wss, 10000);
        log.info('WebSocket server shut down successfully');
    }
    catch (error) {
        log.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Example: Broadcasting system notifications
export function broadcastSystemNotification(message) {
    broadcastMessage({
        type: 'system_notification',
        payload: {
            message,
            timestamp: Date.now()
        }
    });
}
// Example: Send notification to specific user
export function sendUserNotification(userId, notification) {
    return sendToUser(userId, {
        type: 'notification',
        payload: notification
    });
}
