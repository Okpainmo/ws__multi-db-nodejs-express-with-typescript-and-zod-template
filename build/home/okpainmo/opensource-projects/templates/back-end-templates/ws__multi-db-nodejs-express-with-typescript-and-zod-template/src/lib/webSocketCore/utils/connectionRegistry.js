import log from '../../../utils/logger.js';
// Active connections map
export const activeConnections = new Map();
// User connections map (userId -> Set of connection IDs)
export const userConnections = new Map();
/**
 * Register a new WebSocket connection
 */
export function registerConnection(ws, userId) {
    activeConnections.set(ws.id, ws);
    if (userId) {
        ws.userId = userId;
        if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
        }
        userConnections.get(userId).add(ws.id);
    }
    log.info(`Connection registered - ID: ${ws.id}, UserID: ${userId || 'anonymous'}, Total: ${activeConnections.size}`);
}
/**
 * Unregister a WebSocket connection
 */
export function unregisterConnection(connectionId) {
    const ws = activeConnections.get(connectionId);
    if (!ws) {
        return;
    }
    // Remove from user connections map
    if (ws.userId) {
        const userConns = userConnections.get(ws.userId);
        if (userConns) {
            userConns.delete(connectionId);
            if (userConns.size === 0) {
                userConnections.delete(ws.userId);
            }
        }
    }
    // Remove from active connections
    activeConnections.delete(connectionId);
    log.info(`Connection unregistered - ID: ${connectionId}, Total: ${activeConnections.size}`);
}
/**
 * Get connection metadata
 */
export function getConnectionMetadata(connectionId) {
    const ws = activeConnections.get(connectionId);
    if (!ws) {
        return null;
    }
    return {
        id: ws.id,
        connectedAt: ws.metadata?.connectedAt || new Date(),
        lastActivity: ws.lastActivity || new Date(),
        userId: ws.userId,
        metadata: ws.metadata
    };
}
/**
 * Get all active connection IDs
 */
export function getActiveConnectionIds() {
    return Array.from(activeConnections.keys());
}
/**
 * Get connection count
 */
export function getConnectionCount() {
    return activeConnections.size;
}
/**
 * Get user connection count
 */
export function getUserConnectionCount(userId) {
    return userConnections.get(userId)?.size || 0;
}
/**
 * Check if a user is connected
 */
export function isUserConnected(userId) {
    return getUserConnectionCount(userId) > 0;
}
