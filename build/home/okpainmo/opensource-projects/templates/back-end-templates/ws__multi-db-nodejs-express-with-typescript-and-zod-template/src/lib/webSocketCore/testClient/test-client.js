/**
 * WebSocket Test Client (Node.js)
 *
 * Usage:
 *   tsx src/utils/webSocketCore/test-client.ts
 */
import WebSocket from 'ws';
const SERVER_URL = process.env.WS_URL || 'ws://localhost:5000/ws';
const TEST_DURATION = 30000; // 30 seconds
const stats = {
    sent: 0,
    received: 0,
    errors: 0,
    startTime: Date.now()
};
function log(type, message, data) {
    const timestamp = new Date().toISOString();
    const emoji = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        sent: '📤',
        received: '📥',
        system: '⚙️'
    }[type] || '📌';
    console.log(`${emoji} [${timestamp}] ${type.toUpperCase()}: ${message}`);
    if (data) {
        console.log('   Data:', JSON.stringify(data, null, 2));
    }
}
function printStats() {
    const duration = (Date.now() - stats.startTime) / 1000;
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Statistics');
    console.log('='.repeat(60));
    console.log(`Duration:        ${duration.toFixed(2)}s`);
    console.log(`Messages Sent:   ${stats.sent}`);
    console.log(`Messages Rcvd:   ${stats.received}`);
    console.log(`Errors:          ${stats.errors}`);
    console.log(`Success Rate:    ${stats.errors === 0 ? '100%' : ((1 - stats.errors / (stats.sent + stats.received)) * 100).toFixed(2) + '%'}`);
    console.log('='.repeat(60) + '\n');
}
async function runTests() {
    log('system', `Connecting to ${SERVER_URL}...`);
    const ws = new WebSocket(SERVER_URL);
    // Connection opened
    ws.on('open', () => {
        log('success', 'Connected to WebSocket server');
        // Test 1: Send ping
        setTimeout(() => {
            log('info', 'Test 1: Sending ping...');
            const message = { type: 'ping', timestamp: Date.now() };
            ws.send(JSON.stringify(message));
            stats.sent++;
            log('sent', 'Ping message', message);
        }, 1000);
        // Test 2: Send echo message
        setTimeout(() => {
            log('info', 'Test 2: Sending echo message...');
            const message = {
                type: 'echo',
                payload: { text: 'Hello from Node.js test client!', testId: 2 },
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(message));
            stats.sent++;
            log('sent', 'Echo message', message);
        }, 3000);
        // Test 3: Send authentication
        setTimeout(() => {
            log('info', 'Test 3: Sending authentication...');
            const message = {
                type: 'authenticate',
                payload: { token: 'test-token-12345', userId: 'test-user' },
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(message));
            stats.sent++;
            log('sent', 'Auth message', message);
        }, 5000);
        // Test 4: Send invalid message type
        setTimeout(() => {
            log('info', 'Test 4: Sending invalid message type...');
            const message = {
                type: 'invalid_type_xyz',
                payload: { test: true },
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(message));
            stats.sent++;
            log('sent', 'Invalid message', message);
        }, 7000);
        // Test 5: Send chat message
        setTimeout(() => {
            log('info', 'Test 5: Sending chat message...');
            const message = {
                type: 'chat',
                payload: { recipientId: 'user123', message: 'Test chat message' },
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(message));
            stats.sent++;
            log('sent', 'Chat message', message);
        }, 9000);
        // Test 6: Rapid fire test (stress test)
        setTimeout(() => {
            log('info', 'Test 6: Rapid fire test (10 messages)...');
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const message = {
                        type: 'ping',
                        payload: { sequence: i + 1 },
                        timestamp: Date.now()
                    };
                    ws.send(JSON.stringify(message));
                    stats.sent++;
                    if (i === 0 || i === 9) {
                        log('sent', `Rapid message ${i + 1}/10`, message);
                    }
                }, i * 100);
            }
        }, 12000);
        // Test 7: Large payload test
        setTimeout(() => {
            log('info', 'Test 7: Sending large payload...');
            const largePayload = {
                type: 'echo',
                payload: {
                    data: Array(100)
                        .fill(0)
                        .map((_, i) => ({
                        id: i,
                        text: `Item ${i}`,
                        timestamp: Date.now()
                    }))
                },
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(largePayload));
            stats.sent++;
            log('sent', 'Large payload (100 items)', { items: 100 });
        }, 15000);
        // Test 8: Unicode and special characters
        setTimeout(() => {
            log('info', 'Test 8: Sending unicode and special characters...');
            const message = {
                type: 'echo',
                payload: {
                    emoji: '🚀 🔥 💯 ✨',
                    unicode: 'こんにちは 世界',
                    special: '<script>alert("test")</script>',
                    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
                },
                timestamp: Date.now()
            };
            ws.send(JSON.stringify(message));
            stats.sent++;
            log('sent', 'Unicode message', message);
        }, 18000);
        // Close connection after test duration
        setTimeout(() => {
            log('system', 'All tests completed, closing connection...');
            ws.close(1000, 'Tests completed');
        }, TEST_DURATION);
    });
    // Message received
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            stats.received++;
            log('received', `Message type: ${message.type}`, message);
        }
        catch (error) {
            stats.errors++;
            log('error', 'Failed to parse message', { error, data: data.toString() });
        }
    });
    // Connection closed
    ws.on('close', (code, reason) => {
        log('system', `Connection closed`, { code, reason: reason.toString() });
        printStats();
        process.exit(0);
    });
    // Error occurred
    ws.on('error', (error) => {
        stats.errors++;
        log('error', 'WebSocket error', { message: error.message, stack: error.stack });
    });
    // Handle process termination
    process.on('SIGINT', () => {
        log('system', 'Received SIGINT, closing connection...');
        ws.close(1000, 'Client shutdown');
    });
    process.on('SIGTERM', () => {
        log('system', 'Received SIGTERM, closing connection...');
        ws.close(1000, 'Client shutdown');
    });
}
// Run the tests
log('system', 'Starting WebSocket test client...');
log('info', `Test duration: ${TEST_DURATION / 1000}s`);
console.log('');
runTests().catch((error) => {
    log('error', 'Test runner failed', error);
    process.exit(1);
});
