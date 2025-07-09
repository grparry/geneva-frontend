#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🔧 Testing Worker Progress WebSocket\n');

async function testEndpoint(url, name) {
    console.log(`🔌 Testing ${name}: ${url}`);
    
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.log(`❌ TIMEOUT: ${name}\n`);
            resolve(false);
        }, 5000);

        const ws = new WebSocket(url);
        
        ws.on('open', () => {
            clearTimeout(timeout);
            console.log(`✅ CONNECTED: ${name}`);
            
            setTimeout(() => {
                ws.close();
                console.log(`🔌 CLOSED: ${name}\n`);
                resolve(true);
            }, 3000);
        });
        
        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                console.log(`📨 ${name} MESSAGE:`, JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.log(`📨 ${name} MESSAGE (raw):`, data.toString());
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log(`❌ ERROR: ${name} - ${error.message}\n`);
            resolve(false);
        });
    });
}

async function runTests() {
    const endpoints = [
        ['ws://localhost:8080/api/workers/progress', 'Global Progress'],
        ['ws://localhost:8080/api/workers/progress/test-task-123', 'Task Progress'],
        ['ws://localhost:8080/api/infrastructure', 'Infrastructure']
    ];

    let passed = 0;
    
    for (const [url, name] of endpoints) {
        const success = await testEndpoint(url, name);
        if (success) passed++;
    }
    
    console.log(`📊 Worker Progress Results: ${passed}/${endpoints.length} endpoints working`);
    
    if (passed > 0) {
        console.log('✅ Worker Progress WebSocket: WORKING');
    } else {
        console.log('❌ Worker Progress WebSocket: NOT WORKING');
    }
}

runTests().catch(console.error);