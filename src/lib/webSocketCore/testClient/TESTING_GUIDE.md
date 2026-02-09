# WebSocket Testing Guide

This directory contains tools for testing and verifying the WebSocket server implementation. It provides both a command-line interface (CLI) for automated testing and a browser-based client for manual interaction.

## 📂 Contents

- **`test-client.ts`**: A Node.js-based automated test runner that performs a suite of integration tests.
- **`test-client.html`**: A modern, interactive web interface for manually testing WebSocket connections and messages.

---

## 🚀 Automated Testing (CLI)

The `test-client.ts` script runs a series of predefined tests to verify the server's stability and message handling capabilities.

### Prerequisites

- Ensure the WebSocket server is running (usually on `ws://localhost:5000/ws`).
- Node.js environment with `tsx` installed (via `package.json` scripts).

### How to Run

You can run the test client using the npm script defined in `package.json`:

```bash
npm run ws:test
# or
bun run ws:test
```

### Test Suite

The client executes the following tests sequentially over a 30-second duration:

1.  **Ping/Pong**: Verifies basic connectivity and heartbeat mechanisms.
2.  **Echo**: Tests round-trip message delivery.
3.  **Authentication**: Simulates sending authentication credentials (verify logs for server handling).
4.  **Invalid Message Type**: Checks how the server handles unknown message types (expects error response).
5.  **Chat Simulation**: Simulates a standard chat message payload.
6.  **Rapid Fire (Stress Test)**: Sends 10 messages in quick succession (100ms intervals) to test throughput.
7.  **Large Payload**: Sends a message with a large data payload (100 items) to verify frame handling.
8.  **Unicode & Special Characters**: Tests handling of emojis, foreign scripts, and symbols.

### Output

The script provides detailed logging with emojis for readability and a final statistical summary:

- **Duration**: Total time taken.
- **Messages Sent/Received**: Count of messages exchanged.
- **Errors**: Number of connection or parsing errors.
- **Success Rate**: Percentage of successful message exchanges.

---

## 🖥️ Manual Testing (Web Client)

The `test-client.html` file provides a graphical user interface for interacting with the WebSocket server.

### How to Use

You can open the client using the npm script:

```bash
npm run ws:client
# or
bun run ws:client
```

Alternatively, simply open `src/lib/webSocketCore/testClient/test-client.html` in any modern web browser.

### Features

- **Connection Management**: Connect and disconnect from any WebSocket URL.
- **Real-time Logs**: View sent (blue), received (green), and system (purple) messages in a formatted list.
- **Message Types**: Pre-filled templates for common message types:
  - **Ping**
  - **Echo**
  - **Authenticate**
  - **Chat**
  - **Custom JSON**: Write your own payloads.
- **Visual Feedback**: Status indicators and real-time counters for sent/received messages and errors.
- **Keyboard Shortcuts**: Press `Ctrl + Enter` in the payload area to quickly send a message.

---

## 🔧 troubleshooting

- **Connection Refused**: Ensure the server is running and the URL is correct (default `ws://localhost:5000/ws`).
- **Timeouts**: If the CLI test exits early, check the `TEST_DURATION` constant in `test-client.ts`.
- **CORS Issues**: The web client runs locally; ensure the server allows connections from your origin (or lacks strict origin checks for development).
