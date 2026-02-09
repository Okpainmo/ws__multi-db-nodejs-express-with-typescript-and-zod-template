import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';

// Connection state enum for better type safety
export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3
}

// Connection metadata type
export type ConnectionMetadata = {
  id: string;
  connectedAt: Date;
  lastActivity: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
};

// Message types
export type WebSocketMessage = {
  type: string;
  payload?: unknown;
  timestamp?: number;
};

// WebSocket client wrapper with metadata (using intersection for type)
export type ExtendedWebSocket = WebSocket & {
  id: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  isAlive?: boolean;
  lastActivity?: Date;
};

// Type for message handler
export type MessageHandler = (ws: ExtendedWebSocket, message: WebSocketMessage) => void | Promise<void>;

// Type for connection handler
export type ConnectionHandler = (ws: ExtendedWebSocket, request: IncomingMessage) => void | Promise<void>;

// Type for close handler
export type CloseHandler = (ws: ExtendedWebSocket, code: number, reason: Buffer) => void | Promise<void>;

// Type for error handler
export type ErrorHandler = (ws: ExtendedWebSocket, error: Error) => void | Promise<void>;
