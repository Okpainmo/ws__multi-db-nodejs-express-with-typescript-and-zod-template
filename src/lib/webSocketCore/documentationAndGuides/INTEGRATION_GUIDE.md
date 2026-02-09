# WebSocket Integration Guide

This guide shows you how to integrate the WebSocket server into your existing Express application.

## Step 1: Create a WebSocket Route/Domain (Optional)

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

## Step 2: Test Your WebSocket Server

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

## Step 3: Add WebSocket Types (Optional)

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
