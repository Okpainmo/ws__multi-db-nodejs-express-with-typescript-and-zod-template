# WebSocket Core - Directory Structure

```
src/utils/webSocketCore/
├── index.ts                    # Main WebSocket implementation (13.7 KB)
│   ├── Enums
│   │   └── WebSocketState (CONNECTING, OPEN, CLOSING, CLOSED)
│   ├── Types
│   │   ├── ConnectionMetadata
│   │   ├── WebSocketMessage
│   │   ├── ExtendedWebSocket
│   │   └── Handler types
│   ├── Core Functions (22 functions)
│   │   ├── Connection Management
│   │   │   ├── registerConnection()
│   │   │   ├── unregisterConnection()
│   │   │   ├── getConnectionMetadata()
│   │   │   ├── getActiveConnectionIds()
│   │   │   └── getConnectionCount()
│   │   ├── User Management
│   │   │   ├── isUserConnected()
│   │   │   ├── getUserConnectionCount()
│   │   │   └── sendToUser()
│   │   ├── Messaging
│   │   │   ├── safeSendMessage()
│   │   │   ├── broadcastMessage()
│   │   │   ├── sendToConnection()
│   │   │   └── parseMessage()
│   │   ├── State Management
│   │   │   ├── isSocketOpen()
│   │   │   ├── isSocketClosing()
│   │   │   ├── isSocketInState()
│   │   │   └── handleStateTransition()
│   │   ├── Server Management
│   │   │   ├── createWebSocketServer()
│   │   │   ├── setupHeartbeat()
│   │   │   ├── shutdownWebSocketServer()
│   │   │   └── safeCloseSocket()
│   │   └── Utilities
│   │       └── generateConnectionId()
│   └── Internal State
│       ├── activeConnections (Map<connectionId, WebSocket>)
│       └── userConnections (Map<userId, Set<connectionId>>)
│
├── example-usage.ts            # Implementation examples (5.9 KB)
│   ├── initializeWebSocketServer()
│   ├── handleAuthentication()
│   ├── handleChatMessage()
│   ├── gracefulShutdown()
│   ├── broadcastSystemNotification()
│   └── sendUserNotification()
│
├── test-client.ts              # Node.js test suite (6.6 KB)
│   ├── 8 Automated Tests
│   │   ├── Test 1: Ping/Pong
│   │   ├── Test 2: Echo Message
│   │   ├── Test 3: Authentication
│   │   ├── Test 4: Invalid Message
│   │   ├── Test 5: Chat Message
│   │   ├── Test 6: Rapid Fire (10 msgs)
│   │   ├── Test 7: Large Payload (100 items)
│   │   └── Test 8: Unicode & Special Chars
│   └── Statistics Reporting
│
├── test-client.html            # Interactive HTML client (14.8 KB)
│   ├── Beautiful UI with gradients
│   ├── Connection controls
│   ├── Message composer
│   ├── Real-time message display
│   ├── Statistics dashboard
│   └── Keyboard shortcuts
│
├── README.md                   # API Reference (10.0 KB)
│   ├── Quick Start Guide
│   ├── Complete API Documentation
│   ├── Usage Examples
│   ├── Best Practices
│   └── Troubleshooting
│
├── INTEGRATION_GUIDE.md        # Integration Tutorial (13.0 KB)
│   ├── Step-by-step integration
│   ├── app.ts modification examples
│   ├── Domain organization
│   ├── Use case examples
│   ├── Security considerations
│   └── Next steps
│
└── SUMMARY.md                  # Overview Document (7.9 KB)
    ├── Complete features list
    ├── Quick start guide
    ├── Usage examples
    ├── Test scenarios
    └── Troubleshooting

Total: 7 files, 73.0 KB
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Application                     │
│                        (app.ts)                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Creates HTTP Server
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Server (http)                       │
│                                                             │
│  ┌───────────────┐              ┌──────────────────────┐   │
│  │   REST API    │              │  WebSocket Server    │   │
│  │  (Express)    │              │  (createWSServer)    │   │
│  │               │              │                      │   │
│  │  /api/v1/...  │              │  ws://host:port/ws   │   │
│  └───────────────┘              └──────────┬───────────┘   │
│                                            │               │
└────────────────────────────────────────────┼───────────────┘
                                             │
                    ┌────────────────────────┴────────────┐
                    │                                     │
                    ▼                                     ▼
        ┌──────────────────────┐           ┌──────────────────────┐
        │  WebSocket Core      │           │  Event Handlers      │
        │  (index.ts)          │           │                      │
        │                      │           │  • onConnection      │
        │  • State Management  │◄──────────┤  • onMessage         │
        │  • Message Handling  │           │  • onClose           │
        │  • Broadcasting      │           │  • onError           │
        │  • User Tracking     │           │                      │
        └──────────┬───────────┘           └──────────────────────┘
                   │
                   │ Manages
                   ▼
    ┌──────────────────────────────────────────────┐
    │         Connection State Maps                │
    │                                              │
    │  activeConnections: Map<id, WebSocket>       │
    │  userConnections: Map<userId, Set<id>>       │
    └──────────────────────────────────────────────┘
                   │
                   │ Distributes to
                   ▼
    ┌──────────────────────────────────────────────┐
    │              Connected Clients               │
    │                                              │
    │  [Client 1]  [Client 2]  ...  [Client N]     │
    │    user1       user1           user2         │
    │    conn1       conn2           conn1         │
    └──────────────────────────────────────────────┘
```

## Data Flow

### Incoming Message Flow

```
Client
  │
  │ WebSocket Message (JSON)
  │
  ▼
WebSocket Server
  │
  │ onMessage event
  │
  ▼
parseMessage()
  │
  │ Parsed WebSocketMessage
  │
  ▼
Message Handler
  │
  │ Business Logic
  │
  ├─────► Update Database
  │
  ├─────► sendToUser()
  │
  └─────► broadcastMessage()
```

### Outgoing Message Flow

```
Business Logic
  │
  │ Call helper function
  │
  ├─────► sendToUser(userId, message)
  │       │
  │       ├─► Look up user connections
  │       │
  │       └─► For each connection
  │           │
  │           ├─► isSocketOpen() ?
  │           │
  │           └─► safeSendMessage()
  │
  ├─────► broadcastMessage(message, exclude?)
  │       │
  │       └─► For each active connection
  │           │
  │           ├─► Skip excluded?
  │           │
  │           └─► safeSendMessage()
  │
  └─────► sendToConnection(id, message)
          │
          ├─► Find connection
          │
          └─► safeSendMessage()
                  │
                  ├─► Check state
                  │
                  ├─► Add timestamp
                  │
                  └─► ws.send()
```

## State Lifecycle

```
Connection Established
       │
       ▼
┌──────────────┐
│  CONNECTING  │ State = 0
│  (Initial)   │
└──────┬───────┘
       │
       │ Connection Opens
       ▼
┌──────────────┐
│     OPEN     │ State = 1
│  (Active)    │ • Messages can be sent/received
│              │ • Heartbeat active
└──────┬───────┘ • Connection registered
       │
       │ Close initiated
       ▼
┌──────────────┐
│   CLOSING    │ State = 2
│  (Shutdown)  │ • Stop sending new messages
│              │ • Wait for acknowledgment
└──────┬───────┘ • Cleanup started
       │
       │ Connection closed
       ▼
┌──────────────┐
│    CLOSED    │ State = 3
│  (Complete)  │ • Connection unregistered
│              │ • Resources freed
└──────────────┘ • Intervals cleared
```

## Helper Function Categories

### 🔗 Connection Management (5 functions)

- Control connection lifecycle
- Track active connections
- Store metadata

### 👤 User Management (3 functions)

- Associate users with connections
- Track user presence
- User-based messaging

### 📨 Messaging (4 functions)

- Send safely with state checks
- Broadcast to all/specific users
- Parse incoming messages

### 🔄 State Management (4 functions)

- Check connection state
- Handle state transitions
- Prevent invalid operations

### ⚙️ Server Management (4 functions)

- Create and configure server
- Heartbeat monitoring
- Graceful shutdown

### 🛠️ Utilities (2 functions)

- Generate unique IDs
- Helper functions

## Integration Points

```
Your App                    WebSocket Core
────────                    ──────────────

app.ts                      index.ts
  │                            │
  ├─► createServer()           │
  │                            │
  ├─► createWebSocketServer() ◄┘
  │   │
  │   ├─► onConnection ────► registerConnection()
  │   │                      setupHeartbeat()
  │   │
  │   ├─► onMessage ──────► parseMessage()
  │   │                     Your handler logic
  │   │
  │   ├─► onClose ────────► unregisterConnection()
  │   │
  │   └─► onError ────────► Error logging
  │
  └─► httpServer.listen()

Business Logic             Helper Functions
──────────────             ────────────────

notifyUser() ──────────► sendToUser()
                          │
                          └─► safeSendMessage()

sendMessage() ─────────► sendToConnection()
                          │
                          └─► safeSendMessage()

announcement() ────────► broadcastMessage()
                          │
                          └─► safeSendMessage()

checkOnline() ─────────► isUserConnected()
```

## Testing Workflow

```
Development                 Testing
───────────                ────────

1. Start server             npm run dev
   │
   ▼
2. Choose test method
   │
   ├─► HTML Client         npm run ws:client
   │   │                   (Interactive browser UI)
   │   │
   │   ├─► Connect
   │   ├─► Send messages
   │   ├─► View real-time responses
   │   └─► Check statistics
   │
   ├─► Node.js Tests       npm run ws:test
   │   │                   (Automated test suite)
   │   │
   │   ├─► 8 test scenarios
   │   ├─► Performance metrics
   │   └─► Final statistics
   │
   └─► Browser Console     Manual testing
       │
       ├─► new WebSocket()
       ├─► Send custom messages
       └─► Inspect responses
```

## File Relationships

```
index.ts (Core)
    │
    ├─── Used by ───► example-usage.ts
    │                 (Shows how to use)
    │
    ├─── Tested by ──► test-client.ts
    │                  (Automated tests)
    │
    ├─── Tested by ──► test-client.html
    │                  (Manual testing)
    │
    ├─── Documented in ──► README.md
    │                      (API reference)
    │
    ├─── Integration via ──► INTEGRATION_GUIDE.md
    │                        (How to add to app)
    │
    └─── Summarized in ────► SUMMARY.md
                             (Overview)
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│              WEBSOCKET CORE QUICK REFERENCE             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Import:                                                │
│    import { ... } from './utils/webSocketCore'          │
│                                                         │
│  Create Server:                                         │
│    createWebSocketServer(httpServer, options)           │
│                                                         │
│  Send Message:                                          │
│    safeSendMessage(ws, { type, payload })               │
│                                                         │
│  Broadcast:                                             │
│    broadcastMessage({ type, payload })                  │
│                                                         │
│  Send to User:                                          │
│    sendToUser(userId, { type, payload })                │
│                                                         │
│  Check Status:                                          │
│    isSocketOpen(ws)                                     │
│    isUserConnected(userId)                              │
│                                                         │
│  Get Info:                                              │
│    getConnectionCount()                                 │
│    getUserConnectionCount(userId)                       │
│                                                         │
│  Shutdown:                                              │
│    shutdownWebSocketServer(wss, timeout)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
