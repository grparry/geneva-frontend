#!/usr/bin/env node

const WebSocket = require('ws');

// Use the fresh room ID
const ROOM_ID = '6e2fe870-b032-4fb4-8196-84f8d9963c3c';
const WS_URL = `ws://localhost:8080/api/chat/ws/${ROOM_ID}`;

console.log('🚀 Testing Fresh Room WebSocket Connection');
console.log(`🔌 Connecting to: ${WS_URL}\n`);

const ws = new WebSocket(WS_URL);

let messageCount = 0;

ws.on('open', function open() {
    console.log('✅ WebSocket Connected Successfully!');
    console.log('📤 Sending test message...\n');
    
    // Send a test message
    ws.send(JSON.stringify({
        type: 'message',
        content: 'Phase 6 multi-agent coordination test!',
        user_id: 'developer'
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
    
    console.log(`\n📊 Final Status:`);
    console.log(`Messages received: ${messageCount}`);
    
    if (messageCount > 0) {
        console.log('🎉 SUCCESS: WebSocket communication working!');
        console.log('✅ Phase 6 Chat Integration: READY');
        console.log('🚀 Frontend can now connect to multi-agent backend');
    } else {
        console.log('❌ FAILED: No communication received');
    }
});

// Close connection after 5 seconds
setTimeout(() => {
    console.log('⏰ Closing connection...');
    ws.close();
}, 5000);