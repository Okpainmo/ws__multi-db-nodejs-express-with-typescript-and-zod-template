import { WebSocket } from 'ws';
import { WebSocketState } from '../types.js';

/**
 * Check if a WebSocket is in a specific state
 */
export function isSocketInState(ws: WebSocket, state: WebSocketState): boolean {
  return ws.readyState === state;
}

/**
 * Check if a WebSocket is open and ready to send messages
 */
export function isSocketOpen(ws: WebSocket): boolean {
  return ws.readyState === WebSocketState.OPEN;
}

/**
 * Check if a WebSocket is closing or closed
 */
export function isSocketClosing(ws: WebSocket): boolean {
  return ws.readyState === WebSocketState.CLOSING || ws.readyState === WebSocketState.CLOSED;
}
