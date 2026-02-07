# WebSocket Integration Guide

This guide shows you how to integrate the WebSocket server into your existing Express application.

## Step 1: Update `app.ts` to Use HTTP Server

Your current `app.ts` uses `app.listen()` directly. To add WebSocket support, you need to create an HTTP server and attach both Express and WebSocket to it.

### Before:

```typescript
app.listen(port, () => log.info(`Server is listening on port ${port}...`));
```

### After:

```typescript
import { createServer } from 'http';
import { createWebSocketServer } from './utils/webSocketCore/index.js';

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server
const wss = createWebSocketServer(httpServer, {
  path: '/ws',
  heartbeatInterval: 30000,

  onConnection: async (ws, request) => {
    log.info(`WebSocket client connected from ${request.socket.remoteAddress}`);
  },

  onMessage: async (ws, message) => {
    log.info(`Received WebSocket message - Type: ${message.type}, Connection: ${ws.id}`);

    // Handle different message types
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        log.warn(`Unhandled message type: ${message.type}`);
    }
  },

  onClose: async (ws, code, reason) => {
    log.info(`WebSocket connection closed - ID: ${ws.id}, Code: ${code}`);
  },

  onError: async (ws, error) => {
    log.error(`WebSocket error - ID: ${ws.id}, Error: ${error.message}`);
  }
});

// Listen on HTTP server instead of app
httpServer.listen(port, () => log.info(`Server is listening on port ${port}...`));

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('SIGTERM signal received: closing HTTP server');

  // Shutdown WebSocket server first
  await shutdownWebSocketServer(wss, 10000);

  // Close HTTP server
  httpServer.close(() => {
    log.info('HTTP server closed');
    process.exit(0);
  });
});
```

## Step 2: Complete Modified `app.ts`

Here's the complete modified `start()` function with WebSocket integration:

```typescript
import { createServer } from 'http';
import { createWebSocketServer, shutdownWebSocketServer } from './utils/webSocketCore/index.js';

const start = async () => {
  const mongoDb_URI = process.env.MONGO_DB_URI;

  try {
    log.info(`Establishing database connection...`);
    const mongoDbConnection = await connectMongoDb(mongoDb_URI);

    if (mongoDbConnection) {
      log.info(
        `...................................
Connected to: ${mongoDbConnection?.connection.host}
Environment: ${process.env.DEPLOY_ENV ? process.env.DEPLOY_ENV : 'development'}
MongoDB connected successfully 
........................................................`
      );
    }

    await connectPostgres();
    const parsedUrl = new URL(process.env.POSTGRES_DATABASE_URL as string);

    log.info(
      `...................................
Connected to: ${parsedUrl.hostname}
Environment: ${process.env.DEPLOY_ENV ? process.env.DEPLOY_ENV : 'development'}
PostgreSQL connected successfully 
........................................................`
    );

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket server
    const wss = createWebSocketServer(httpServer, {
      path: '/ws',
      heartbeatInterval: 30000,

      onConnection: async (ws, request) => {
        log.info(`WebSocket client connected from ${request.socket.remoteAddress}`);

        // Send welcome message
        ws.send(
          JSON.stringify({
            type: 'welcome',
            payload: {
              message: 'Connected to Multi-DB Server WebSocket',
              connectionId: ws.id,
              timestamp: Date.now()
            }
          })
        );
      },

      onMessage: async (ws, message) => {
        log.info(`Received WebSocket message - Type: ${message.type}, Connection: ${ws.id}`);

        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;

          case 'echo':
            ws.send(
              JSON.stringify({
                type: 'echo_response',
                payload: message.payload,
                timestamp: Date.now()
              })
            );
            break;

          default:
            log.warn(`Unhandled message type: ${message.type}`);
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: `Unknown message type: ${message.type}` }
              })
            );
        }
      },

      onClose: async (ws, code, reason) => {
        log.info(`WebSocket connection closed - ID: ${ws.id}, Code: ${code}, Reason: ${reason.toString()}`);
      },

      onError: async (ws, error) => {
        log.error(`WebSocket error - ID: ${ws.id}, Error: ${error.message}`);
      }
    });

    // Start server
    httpServer.listen(port, () => {
      log.info(`...................................`);
      log.info(`Server is listening on port ${port}`);
      log.info(`HTTP: http://localhost:${port}`);
      log.info(`WebSocket: ws://localhost:${port}/ws`);
      log.info(`...................................`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      log.info(`${signal} signal received: closing server gracefully`);

      try {
        // Shutdown WebSocket server first
        await shutdownWebSocketServer(wss, 10000);

        // Close HTTP server
        httpServer.close(() => {
          log.info('HTTP server closed');
          process.exit(0);
        });

        // Force exit after timeout
        setTimeout(() => {
          log.error('Forced shutdown after timeout');
          process.exit(1);
        }, 15000);
      } catch (error) {
        log.error(`Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message);
    }
    process.exit(1);
  }
};

start();
```

## Step 3: Create a WebSocket Route/Domain (Optional)

For better organization, you can create a dedicated WebSocket domain similar to your user/auth domains:

### File: `src/domains/websocket/handlers/messageHandler.ts`

```typescript
import { ExtendedWebSocket, WebSocketMessage } from '../../../utils/webSocketCore/index.js';
import log from '../../../utils/logger.js';

export async function handleWebSocketMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
  log.info(`Processing message - Type: ${message.type}, Connection: ${ws.id}`);

  switch (message.type) {
    case 'authenticate':
      await handleAuthenticate(ws, message);
      break;

    case 'chat':
      await handleChatMessage(ws, message);
      break;

    case 'subscribe':
      await handleSubscribe(ws, message);
      break;

    default:
      ws.send(
        JSON.stringify({
          type: 'error',
          payload: { message: `Unknown message type: ${message.type}` }
        })
      );
  }
}

async function handleAuthenticate(ws: ExtendedWebSocket, message: WebSocketMessage) {
  // Extract token from message
  const { token } = message.payload as { token: string };

  // Verify token and get userId
  // const userId = await verifyToken(token);

  // For now, mock authentication
  const userId = 'user_' + Date.now();
  ws.userId = userId;

  ws.send(
    JSON.stringify({
      type: 'authenticated',
      payload: { userId, connectionId: ws.id }
    })
  );
}

async function handleChatMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
  if (!ws.userId) {
    ws.send(
      JSON.stringify({
        type: 'error',
        payload: { message: 'Not authenticated' }
      })
    );
    return;
  }

  // Process chat message
  log.info(`Chat message from ${ws.userId}: ${JSON.stringify(message.payload)}`);

  // Echo back for now
  ws.send(
    JSON.stringify({
      type: 'chat_received',
      payload: message.payload
    })
  );
}

async function handleSubscribe(ws: ExtendedWebSocket, message: WebSocketMessage) {
  const { channel } = message.payload as { channel: string };

  // Store subscription in metadata
  if (!ws.metadata) ws.metadata = {};
  if (!ws.metadata.subscriptions) ws.metadata.subscriptions = [];
  (ws.metadata.subscriptions as string[]).push(channel);

  ws.send(
    JSON.stringify({
      type: 'subscribed',
      payload: { channel }
    })
  );
}
```

## Step 4: Test Your WebSocket Server

### Using the Test Client

Run the provided test client:

```bash
npm run ws:test
```

Or create a simple HTML test page (see `test-client.html` below).

### Using Browser Console

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('Connected!');

  // Send ping
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

### Using a WebSocket Client Tool

Popular tools:

- **Postman** - Has WebSocket support
- **wscat** - Command-line tool: `npx wscat -c ws://localhost:5000/ws`
- **Insomnia** - API client with WebSocket support

## Step 5: Add WebSocket Types (Optional)

Create type definitions for your WebSocket messages:

### File: `src/types/websocket.types.ts`

```typescript
export type ClientMessageType = 'ping' | 'authenticate' | 'chat' | 'subscribe' | 'unsubscribe';

export type ServerMessageType = 'pong' | 'welcome' | 'authenticated' | 'chat_received' | 'subscribed' | 'notification' | 'error';

export type AuthenticatePayload = {
  token: string;
};

export type ChatPayload = {
  recipientId: string;
  message: string;
};

export type SubscribePayload = {
  channel: string;
};

export type NotificationPayload = {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
};
```

## Common Use Cases

### 1. Real-time Notifications

```typescript
import { sendToUser } from './utils/webSocketCore/index.js';

// In your business logic
export async function notifyUser(userId: string, notification: unknown) {
  sendToUser(userId, {
    type: 'notification',
    payload: notification
  });
}
```

### 2. Broadcasting System Messages

```typescript
import { broadcastMessage } from './utils/webSocketCore/index.js';

// Broadcast to all connected clients
export function broadcastSystemMessage(message: string) {
  broadcastMessage({
    type: 'system_message',
    payload: { message, timestamp: Date.now() }
  });
}
```

### 3. Real-time Chat

```typescript
import { sendToUser, isUserConnected } from './utils/webSocketCore/index.js';

export async function sendChatMessage(fromUserId: string, toUserId: string, message: string) {
  if (!isUserConnected(toUserId)) {
    // Store message for later delivery
    return { delivered: false, reason: 'User offline' };
  }

  const sent = sendToUser(toUserId, {
    type: 'chat',
    payload: {
      from: fromUserId,
      message,
      timestamp: Date.now()
    }
  });

  return { delivered: sent };
}
```

## Environment Variables

Add WebSocket configuration to your `.env` files:

```env
# WebSocket Configuration
WS_PATH=/ws
WS_HEARTBEAT_INTERVAL=30000
WS_SHUTDOWN_TIMEOUT=10000
```

## Security Considerations

1. **Authentication**: Validate user tokens in the `onConnection` or `onMessage` handler
2. **Rate Limiting**: Implement message rate limiting per connection
3. **Message Validation**: Use Zod schemas to validate incoming messages
4. **Origin Checking**: Validate the request origin in production
5. **Encryption**: Use WSS (WebSocket Secure) in production with HTTPS

## Next Steps

1. ✅ Integrate WebSocket into `app.ts`
2. ✅ Test basic connectivity
3. ✅ Implement authentication
4. ✅ Add message validation with Zod
5. ✅ Create domain-specific handlers
6. ✅ Add rate limiting
7. ✅ Deploy with WSS support

## Troubleshooting

### Connection Refused

- Ensure your server is running
- Check the WebSocket path matches (`/ws`)
- Verify the port is correct

### Messages Not Received

- Check WebSocket state with `isSocketOpen()`
- Verify JSON format is correct
- Check server logs for errors

### Connection Keeps Dropping

- Adjust `heartbeatInterval` if needed
- Check for network issues
- Verify client properly handles ping/pong

### TypeScript Errors

- Ensure all imports use `.js` extension
- Check that types are properly exported
- Verify `@types/ws` is installed

## Resources

- [ws Documentation](https://github.com/websockets/ws)
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [RFC 6455 - WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
