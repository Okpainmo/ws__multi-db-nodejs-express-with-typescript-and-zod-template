import { WebSocket } from 'ws';
import log from '../../../utils/logger.js';
import type { WebSocketMessage } from '../types.js';
import { isSocketOpen } from './socketStatus.js';

/**
 * Safely send a message to a WebSocket client
 */
export function safeSendMessage(ws: WebSocket, message: WebSocketMessage): boolean {
  try {
    if (!isSocketOpen(ws)) {
      log.warn({ level: 'warn', readyState: ws.readyState }, 'Cannot send message - socket not open');
      return false;
    }

    const messageString = JSON.stringify({
      ...message,
      timestamp: message.timestamp || Date.now()
    });

    ws.send(messageString);
    return true;
  } catch (error) {
    log.error({ level: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, 'Error sending WebSocket message');
    return false;
  }
}

/**
 * Parse incoming WebSocket message
 */
export function parseMessage(data: unknown): WebSocketMessage | null {
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as WebSocketMessage;
    } else if (Buffer.isBuffer(data)) {
      return JSON.parse(data.toString()) as WebSocketMessage;
    }
    return null;
  } catch (error) {
    log.error({ level: 'error', error: error instanceof Error ? error.message : 'Unknown error' }, 'Error parsing WebSocket message');
    return null;
  }
}
