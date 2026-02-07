import log from '../../../utils/logger.js';
import { isSocketOpen } from './socketStatus.js';
/**
 * Setup ping/pong heartbeat for a connection
 */
export function setupHeartbeat(ws, interval = 30000) {
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
        ws.lastActivity = new Date();
    });
    const pingInterval = setInterval(() => {
        if (ws.isAlive === false) {
            log.warn(`Connection ${ws.id} failed heartbeat check - terminating`);
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
