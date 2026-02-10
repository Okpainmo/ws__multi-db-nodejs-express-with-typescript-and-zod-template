import { WebSocket } from 'ws';
import { WebSocketState } from '../types.js';
/**
 * Check if a WebSocket is in a specific state
 */
export function isSocketInState(ws, state) {
    return ws.readyState === state;
}
/**
 * Check if a WebSocket is open and ready to send messages
 */
export function isSocketOpen(ws) {
    return ws.readyState === WebSocketState.OPEN;
}
/**
 * Check if a WebSocket is closing or closed
 */
export function isSocketClosing(ws) {
    return ws.readyState === WebSocketState.CLOSING || ws.readyState === WebSocketState.CLOSED;
}
