import log from '../../../utils/logger.js';
import type { WebSocketMessage } from '../types.js';
import { activeConnections, userConnections } from './connectionRegistry.js';
import { safeSendMessage } from './messageHandler.js';

/**
 * Broadcast a message to all connected clients
 */
export function broadcastMessage(message: WebSocketMessage, excludeConnectionId?: string): void {
  let successCount = 0;
  let failureCount = 0;

  activeConnections.forEach((ws, connectionId) => {
    if (excludeConnectionId && connectionId === excludeConnectionId) {
      return;
    }

    if (safeSendMessage(ws, message)) {
      successCount++;
    } else {
      failureCount++;
    }
  });

  log.info(`Broadcast complete - Success: ${successCount}, Failed: ${failureCount}`);
}

/**
 * Send a message to a specific user (all their connections)
 */
export function sendToUser(userId: string, message: WebSocketMessage): boolean {
  const connectionIds = userConnections.get(userId);

  if (!connectionIds || connectionIds.size === 0) {
    log.warn(`No active connections found for user: ${userId}`);
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
export function sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
  const ws = activeConnections.get(connectionId);

  if (!ws) {
    log.warn(`Connection not found: ${connectionId}`);
    return false;
  }

  return safeSendMessage(ws, message);
}
