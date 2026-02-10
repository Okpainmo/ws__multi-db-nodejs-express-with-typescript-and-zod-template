import log from '../../../utils/logger.js';
import { activeConnections, userConnections } from './connectionRegistry.js';
import { safeSendMessage } from './messageHandler.js';
/**
 * Broadcast a message to all connected clients
 */
export function broadcastMessage(message, excludeConnectionId) {
    let successCount = 0;
    let failureCount = 0;
    activeConnections.forEach((ws, connectionId) => {
        if (excludeConnectionId && connectionId === excludeConnectionId) {
            return;
        }
        if (safeSendMessage(ws, message)) {
            successCount++;
        }
        else {
            failureCount++;
        }
    });
    log.info({ level: 'info', successCount, failureCount }, 'Broadcast complete');
}
/**
 * Send a message to a specific user (all their connections)
 */
export function sendToUser(userId, message) {
    const connectionIds = userConnections.get(userId);
    if (!connectionIds || connectionIds.size === 0) {
        log.warn({ level: 'warn', userId }, 'No active connections found for user');
        return false;
    }
    let successCount = 0;
    connectionIds.forEach((connectionId) => {
        const ws = activeConnections.get(connectionId);
        if (ws && safeSendMessage(ws, message)) {
            successCount++;
        }
    });
    return successCount > 0;
}
/**
 * Send a message to a specific connection
 */
export function sendToConnection(connectionId, message) {
    const ws = activeConnections.get(connectionId);
    if (!ws) {
        log.warn({ level: 'warn', connectionId }, 'Connection not found');
        return false;
    }
    return safeSendMessage(ws, message);
}
