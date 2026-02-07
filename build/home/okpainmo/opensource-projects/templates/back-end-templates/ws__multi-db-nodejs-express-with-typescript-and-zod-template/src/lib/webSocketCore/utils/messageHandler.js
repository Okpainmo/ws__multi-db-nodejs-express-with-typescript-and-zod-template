import { WebSocket } from 'ws';
import log from '../../../utils/logger.js';
import { isSocketOpen } from './socketStatus.js';
/**
 * Safely send a message to a WebSocket client
 */
export function safeSendMessage(ws, message) {
    try {
        if (!isSocketOpen(ws)) {
            log.warn(`Cannot send message - socket not open. State: ${ws.readyState}`);
            return false;
        }
        const messageString = JSON.stringify({
            ...message,
            timestamp: message.timestamp || Date.now()
        });
        ws.send(messageString);
        return true;
    }
    catch (error) {
        log.error(`Error sending WebSocket message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}
/**
 * Parse incoming WebSocket message
 */
export function parseMessage(data) {
    try {
        if (typeof data === 'string') {
            return JSON.parse(data);
        }
        else if (Buffer.isBuffer(data)) {
            return JSON.parse(data.toString());
        }
        return null;
    }
    catch (error) {
        log.error(`Error parsing WebSocket message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
    }
}
