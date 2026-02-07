import log from '../../../utils/logger.js';
import type { ExtendedWebSocket } from '../types.js';
import { WebSocketState } from '../types.js';
import { unregisterConnection } from './connectionRegistry.js';

/**
 * Handle WebSocket state transitions
 */
export function handleStateTransition(ws: ExtendedWebSocket, newState: WebSocketState, oldState: WebSocketState): void {
  log.debug(`WebSocket ${ws.id} state transition: ${WebSocketState[oldState]} -> ${WebSocketState[newState]}`);

  switch (newState) {
    case WebSocketState.OPEN:
      ws.lastActivity = new Date();
      break;

    case WebSocketState.CLOSING:
    case WebSocketState.CLOSED:
      unregisterConnection(ws.id);
      break;

    default:
      break;
  }
}
