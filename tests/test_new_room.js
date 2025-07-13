#!/usr/bin/env node

const WebSocket = require('ws');

// Use the new room ID
const ROOM_ID = 'd9e83b18-5a44-4b55-a0a9-60e11e3a5dfe';
const WS_URL = `ws://localhost:8080/api/chat/ws/${ROOM_ID}`;

console.log('🚀 Testing New Room WebSocket Connection');
console.log(`🔌 Connecting to: ${WS_URL}\n`);

const ws = new WebSocket(WS_URL);

let messageCount = 0;

ws.on('open', function open() {
    console.log('✅ WebSocket Connected Successfully!');
    console.log('📤 Sending test message...\n');
    
    // Send a test message
    ws.send(JSON.stringify({
        type: 'message',
        content: 'Hello from Phase 6 integration test!',
        user_id: 'test-user'
    }));
});

ws.on('message', function message(data) {
    messageCount++;
    console.log(`📨 Message ${messageCount} received:`);
    
    try {
        const parsed = JSON.parse(data.toString());
        console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.log(data.toString());
    }
    console.log('');
});

ws.on('error', function error(err) {
    console.log(`❌ WebSocket Error: ${err.message}`);
});

ws.on('close', function close(code, reason) {
    console.log(`🔌 WebSocket Closed (code: ${code})`);
    if (reason) {
        console.log(`Reason: ${reason}`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`Messages received: ${messageCount}`);
    
    if (messageCount > 0) {
        console.log('🎉 WebSocket integration working!');
        console.log('✨ Ready for Phase 6 frontend development');
        console.log('✅ Chat WebSocket: WORKING');
    } else {
        console.log('⚠️  Connection established but no messages received');
    }
});

// Close connection after 8 seconds
setTimeout(() => {
    console.log('⏰ Closing connection after 8 seconds...');
    ws.close();
}, 8000);