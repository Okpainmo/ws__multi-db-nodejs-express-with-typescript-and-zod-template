import log from '../../../utils/logger.js';
import type { ExtendedWebSocket, ConnectionMetadata } from '../types.js';

// Active connections map
export const activeConnections = new Map<string, ExtendedWebSocket>();

// User connections map (userId -> Set of connection IDs)
export const userConnections = new Map<string, Set<string>>();

/**
 * Register a new WebSocket connection
 */
export function registerConnection(ws: ExtendedWebSocket, userId?: string): void {
  activeConnections.set(ws.id, ws);

  if (userId) {
    ws.userId = userId;
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(ws.id);
  }

  log.info(
    {
      level: 'info',
      connectionId: ws.id,
      userId: userId || 'anonymous',
      totalConnections: activeConnections.size
    },
    'Connection registered'
  );
}

/**
 * Unregister a WebSocket connection
 */
export function unregisterConnection(connectionId: string): void {
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

  log.info({ level: 'info', connectionId, totalConnections: activeConnections.size }, 'Connection unregistered');
}

/**
 * Get connection metadata
 */
export function getConnectionMetadata(connectionId: string): ConnectionMetadata | null {
  const ws = activeConnections.get(connectionId);

  if (!ws) {
    return null;
  }

  return {
    id: ws.id,
    connectedAt: (ws.metadata?.connectedAt as Date) || new Date(),
    lastActivity: ws.lastActivity || new Date(),
    userId: ws.userId,
    metadata: ws.metadata
  };
}

/**
 * Get all active connection IDs
 */
export function getActiveConnectionIds(): string[] {
  return Array.from(activeConnections.keys());
}

/**
 * Get connection count
 */
export function getConnectionCount(): number {
  return activeConnections.size;
}

/**
 * Get user connection count
 */
export function getUserConnectionCount(userId: string): number {
  return userConnections.get(userId)?.size || 0;
}

/**
 * Check if a user is connected
 */
export function isUserConnected(userId: string): boolean {
  return getUserConnectionCount(userId) > 0;
}
