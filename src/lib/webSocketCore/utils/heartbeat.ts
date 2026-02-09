import log from '../../../utils/logger.js';
import type { ExtendedWebSocket } from '../types.js';
import { isSocketOpen } from './socketStatus.js';

/**
 * Setup ping/pong heartbeat for a connection
 */
export function setupHeartbeat(ws: ExtendedWebSocket, interval: number = 30000): NodeJS.Timeout {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
    ws.lastActivity = new Date();
  });

  const pingInterval = setInterval(() => {
    if (ws.isAlive === false) {
      log.warn({ level: 'warn', connectionId: ws.id }, 'Failed heartbeat check - terminating connection');
      clearInterval(pingInterval);
      ws.terminate();
      return;
    }

    ws.isAlive = false;
    if (isSocketOpen(ws)) {
      ws.ping();
    }
  }, interval);

  // Clean up interval on close
  ws.on('close', () => {
    clearInterval(pingInterval);
  });

  return pingInterval;
}
