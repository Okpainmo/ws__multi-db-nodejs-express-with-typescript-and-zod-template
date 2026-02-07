import { WebSocket } from 'ws';
import log from '../../../utils/logger.js';
import { isSocketClosing } from './socketStatus.js';

/**
 * Safely close a WebSocket connection
 */
export function safeCloseSocket(ws: WebSocket, code: number = 1000, reason: string = 'Normal closure'): void {
  try {
    if (!isSocketClosing(ws)) {
      ws.close(code, reason);
    }
  } catch (error) {
    log.error(`Error closing WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
