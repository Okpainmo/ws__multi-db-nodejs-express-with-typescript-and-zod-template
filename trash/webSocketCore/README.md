# WebSocket Core Utilities

A comprehensive WebSocket utility library for managing WebSocket connections, messages, and states in Node.js/Express applications.

## Features

- ✅ **Complete State Management**: Handles all WebSocket states (CONNECTING, OPEN, CLOSING, CLOSED)
- ✅ **Connection Tracking**: Track individual connections and user-based connections
- ✅ **Heartbeat Monitoring**: Built-in ping/pong heartbeat to detect stale connections
- ✅ **Safe Message Sending**: Automatic state checking before sending messages
- ✅ **Broadcasting**: Send messages to all clients or specific users
- ✅ **Graceful Shutdown**: Properly close all connections during server shutdown
- ✅ **Type Safety**: Full TypeScript support with comprehensive type definitions
- ✅ **Error Handling**: Robust error handling throughout

## Installation

The required dependencies are already in your `package.json`:

```json
{
  "dependencies": {
    "ws": "^8.19.0"
  },
  "devDependencies": {
    "@types/ws": "^8.18.1"
  }
}
```

## Quick Start

### 1. Initialize WebSocket Server in your Express app

Update your `app.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import { createWebSocketServer } from './utils/webSocketCore/index.js';

const app = express();
const httpServer = createServer(app);

// Create WebSocket server
const wss = createWebSocketServer(httpServer, {
  path: '/ws',
  heartbeatInterval: 30000,

  onConnection: async (ws, request) => {
    console.log('New connection:', ws.id);
  },

  onMessage: async (ws, message) => {
    console.log('Received:', message);
  },

  onClose: async (ws, code, reason) => {
    console.log('Connection closed:', ws.id);
  },

  onError: async (ws, error) => {
    console.error('WebSocket error:', error);
  }
});

// Start server
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

### 2. Use Helper Functions

```typescript
import { broadcastMessage, sendToUser, sendToConnection, isUserConnected, getConnectionCount } from './utils/webSocketCore/index.js';

// Broadcast to all clients
broadcastMessage({
  type: 'notification',
  payload: { message: 'Server maintenance in 5 minutes' }
});

// Send to specific user (all their connections)
sendToUser('user123', {
  type: 'private_message',
  payload: { from: 'admin', text: 'Hello!' }
});

// Check if user is online
if (isUserConnected('user123')) {
  console.log('User is online');
}

// Get total connections
console.log(`Active connections: ${getConnectionCount()}`);
```

## API Reference

### Enums

#### `WebSocketState`

WebSocket connection states:

- `CONNECTING = 0` - Connection is being established
- `OPEN = 1` - Connection is open and ready
- `CLOSING = 2` - Connection is closing
- `CLOSED = 3` - Connection is closed

### Types

#### `ExtendedWebSocket`

Extended WebSocket with additional metadata:

```typescript
type ExtendedWebSocket = WebSocket & {
  id: string; // Unique connection ID
  userId?: string; // Associated user ID
  metadata?: Record<string, unknown>; // Custom metadata
  isAlive?: boolean; // Heartbeat status
  lastActivity?: Date; // Last activity timestamp
};
```

#### `WebSocketMessage`

Standard message format:

```typescript
type WebSocketMessage = {
  type: string; // Message type
  payload?: unknown; // Message data
  timestamp?: number; // Message timestamp
};
```

### Core Functions

#### `createWebSocketServer(httpServer, options)`

Creates and configures a WebSocket server.

**Parameters:**

- `httpServer` (HTTPServer) - The HTTP server instance
- `options` (object):
  - `path` (string) - WebSocket endpoint path (default: '/ws')
  - `heartbeatInterval` (number) - Ping interval in ms (default: 30000)
  - `onConnection` (function) - Connection handler
  - `onMessage` (function) - Message handler
  - `onClose` (function) - Close handler
  - `onError` (function) - Error handler

**Returns:** `WebSocketServer`

#### `safeSendMessage(ws, message)`

Safely sends a message to a WebSocket client.

**Parameters:**

- `ws` (WebSocket) - The WebSocket connection
- `message` (WebSocketMessage) - The message to send

**Returns:** `boolean` - True if sent successfully

#### `broadcastMessage(message, excludeConnectionId?)`

Broadcasts a message to all connected clients.

**Parameters:**

- `message` (WebSocketMessage) - The message to broadcast
- `excludeConnectionId` (string, optional) - Connection ID to exclude

#### `sendToUser(userId, message)`

Sends a message to all connections of a specific user.

**Parameters:**

- `userId` (string) - The user ID
- `message` (WebSocketMessage) - The message to send

**Returns:** `boolean` - True if sent to at least one connection

#### `sendToConnection(connectionId, message)`

Sends a message to a specific connection.

**Parameters:**

- `connectionId` (string) - The connection ID
- `message` (WebSocketMessage) - The message to send

**Returns:** `boolean` - True if sent successfully

#### `registerConnection(ws, userId?)`

Registers a new WebSocket connection.

**Parameters:**

- `ws` (ExtendedWebSocket) - The WebSocket connection
- `userId` (string, optional) - The user ID to associate

#### `unregisterConnection(connectionId)`

Unregisters a WebSocket connection.

**Parameters:**

- `connectionId` (string) - The connection ID

#### `isSocketOpen(ws)`

Checks if a WebSocket is open and ready.

**Parameters:**

- `ws` (WebSocket) - The WebSocket connection

**Returns:** `boolean`

#### `isSocketClosing(ws)`

Checks if a WebSocket is closing or closed.

**Parameters:**

- `ws` (WebSocket) - The WebSocket connection

**Returns:** `boolean`

#### `isUserConnected(userId)`

Checks if a user has any active connections.

**Parameters:**

- `userId` (string) - The user ID

**Returns:** `boolean`

#### `getConnectionCount()`

Gets the total number of active connections.

**Returns:** `number`

#### `getUserConnectionCount(userId)`

Gets the number of active connections for a user.

**Parameters:**

- `userId` (string) - The user ID

**Returns:** `number`

#### `setupHeartbeat(ws, interval?)`

Sets up ping/pong heartbeat for a connection.

**Parameters:**

- `ws` (ExtendedWebSocket) - The WebSocket connection
- `interval` (number, optional) - Ping interval in ms (default: 30000)

**Returns:** `NodeJS.Timeout` - The interval timer

#### `shutdownWebSocketServer(wss, timeout?)`

Gracefully shuts down the WebSocket server.

**Parameters:**

- `wss` (WebSocketServer) - The WebSocket server
- `timeout` (number, optional) - Shutdown timeout in ms (default: 10000)

**Returns:** `Promise<void>`

## State Handling

The library properly handles all WebSocket states:

### CONNECTING (0)

- Connection is being established
- Messages cannot be sent yet

### OPEN (1)

- Connection is ready
- Messages can be sent and received
- Heartbeat is active

### CLOSING (2)

- Connection is closing
- No new messages should be sent
- Cleanup is in progress

### CLOSED (3)

- Connection is completely closed
- All resources are cleaned up
- Connection is removed from tracking

The `safeSendMessage()` function automatically checks the state before sending:

```typescript
if (!isSocketOpen(ws)) {
  log.warn(`Cannot send - socket not open. State: ${ws.readyState}`);
  return false;
}
```

## Message Flow

### Client → Server

```typescript
onMessage: async (ws, message) => {
  switch (message.type) {
    case 'authenticate':
      // Handle auth
      break;
    case 'chat':
      // Handle chat
      break;
    default:
    // Unknown message type
  }
};
```

### Server → Client

```typescript
// To specific connection
safeSendMessage(ws, {
  type: 'notification',
  payload: { text: 'Hello!' }
});

// To user (all connections)
sendToUser(userId, {
  type: 'update',
  payload: { data: 'new data' }
});

// Broadcast to all
broadcastMessage({
  type: 'announcement',
  payload: { message: 'System maintenance' }
});
```

## Error Handling

All functions include comprehensive error handling:

```typescript
try {
  safeSendMessage(ws, message);
} catch (error) {
  log.error('Send failed:', error);
}
```

Errors are logged and handled gracefully without crashing the server.

## Best Practices

1. **Always use safe functions**: Use `safeSendMessage()` instead of `ws.send()` directly
2. **Check connection state**: Use `isSocketOpen()` before operations
3. **Enable heartbeat**: Keep `heartbeatInterval` enabled to detect stale connections
4. **Graceful shutdown**: Call `shutdownWebSocketServer()` during server shutdown
5. **Handle all message types**: Include a default case in your message handlers
6. **Set userId**: Associate connections with user IDs for user-based messaging
7. **Clean up resources**: The library handles cleanup, but clear any custom intervals/timers

## Example: Complete Integration

See `example-usage.ts` for a complete working example with:

- Authentication
- Chat messaging
- Notifications
- Error handling
- Graceful shutdown

## Logging

The library uses your existing logger (`utils/logger.js`) for all logging:

- `log.info()` - Connection events, state changes
- `log.warn()` - Connection issues, invalid operations
- `log.error()` - Errors and exceptions
- `log.debug()` - State transitions (if debug enabled)

## WebSocket Close Codes

Common close codes used:

- `1000` - Normal closure
- `1001` - Going away (server shutdown)
- `1011` - Internal server error

## Testing

Connect to your WebSocket server using any WebSocket client:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('Connected');
  ws.send(
    JSON.stringify({
      type: 'authenticate',
      payload: { userId: 'user123' }
    })
  );
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

## License

Part of the Multi-DB Node/Express TypeScript Template
