#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🔍 Testing Correct Geneva WebSocket Endpoints\n');

const endpoints = [
    'ws://localhost:8080/api/chat/ws/test-room-123',  // Chat WebSocket 
    'ws://localhost:8080/api/workers/progress',       // Worker progress
    'ws://localhost:8080/infrastructure'              // Infrastructure WebSocket
];

async function testEndpoint(url) {
    console.log(`🔌 Testing: ${url}`);
    
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log(`❌ TIMEOUT: ${url}\n`);
            resolve(false);
        }, 5000);

        const ws = new WebSocket(url);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log(`✅ CONNECTED: ${url}`);
            
            // Send a test message if it's a chat WebSocket
            if (url.includes('/ws/')) {
                ws.send(JSON.stringify({
                    type: 'test',
                    message: 'Hello from integration test'
                }));
                console.log(`📤 Sent test message`);
            }
            
            setTimeout(() => {
                ws.close();
                console.log(`🔌 CLOSED: ${url}\n`);
                resolve(true);
            }, 2000);
        });
        
        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                console.log(`📨 RECEIVED: ${JSON.stringify(parsed, null, 2)}`);
            } catch (e) {
                console.log(`📨 RECEIVED (raw): ${data.toString()}`);
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log(`❌ ERROR: ${url} - ${error.message}\n`);
            resolve(false);
        });
    });
}

async function runTests() {
    let passed = 0;
    
    for (const endpoint of endpoints) {
        const success = await testEndpoint(endpoint);
        if (success) passed++;
    }
    
    console.log(`📊 Results: ${passed}/${endpoints.length} endpoints working`);
    
    if (passed > 0) {
        console.log('✨ Some WebSocket endpoints are accessible!');
        console.log('🚀 Ready to integrate with frontend.');
    } else {
        console.log('🚨 No WebSocket endpoints accessible.');
        console.log('🔍 Check backend status and routing configuration.');
    }
}

runTests().catch(console.error);