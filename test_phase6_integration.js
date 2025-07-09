#!/usr/bin/env node

/**
 * Phase 6 Integration Test
 * Tests the Geneva Phase 6 backend WebSocket connectivity
 */

const WebSocket = require('ws');

class Phase6IntegrationTester {
    constructor() {
        this.backendUrl = 'ws://localhost:8080';
        this.results = {
            endpoints: new Map(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0
        };
    }

    async runTests() {
        console.log('🚀 Geneva Phase 6 Integration Test Suite\n');
        console.log('Testing WebSocket connectivity to Phase 6 backend...\n');
        
        const endpoints = [
            '/api/workers/progress',
            '/api/workers/progress/test-task-123',
            '/api/chat/ws/test-room-123'
        ];

        for (const endpoint of endpoints) {
            await this.testEndpoint(endpoint);
        }

        this.printResults();
    }

    async testEndpoint(endpoint) {
        this.results.totalTests++;
        const fullUrl = `${this.backendUrl}${endpoint}`;
        
        console.log(`🔌 Testing: ${fullUrl}`);
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log(`❌ TIMEOUT: ${endpoint}`);
                this.results.endpoints.set(endpoint, {
                    status: 'timeout',
                    error: 'Connection timeout after 5 seconds'
                });
                this.results.failedTests++;
                resolve();
            }, 5000);

            const ws = new WebSocket(fullUrl);
            
            ws.on('open', () => {
                clearTimeout(timeout);
                console.log(`✅ CONNECTED: ${endpoint}`);
                
                // Send test subscription
                const testMessage = {
                    action: 'subscribe',
                    scope: 'global',
                    scope_id: '*',
                    event_types: ['coordination_event', 'tool_progress']
                };
                
                ws.send(JSON.stringify(testMessage));
                console.log(`📤 Sent test subscription to ${endpoint}`);
                
                this.results.endpoints.set(endpoint, {
                    status: 'connected',
                    messagesSent: 1
                });
                this.results.passedTests++;
                
                // Close after 2 seconds
                setTimeout(() => {
                    ws.close();
                    resolve();
                }, 2000);
            });
            
            ws.on('message', (data) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    console.log(`📨 RECEIVED: ${endpoint} - ${parsed.type || 'unknown'}`);
                    
                    const result = this.results.endpoints.get(endpoint);
                    if (result) {
                        result.messagesReceived = (result.messagesReceived || 0) + 1;
                        result.lastMessage = parsed;
                    }
                } catch (e) {
                    console.log(`📨 RECEIVED (raw): ${endpoint} - ${data.toString()}`);
                }
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                console.log(`❌ ERROR: ${endpoint} - ${error.message}`);
                this.results.endpoints.set(endpoint, {
                    status: 'error',
                    error: error.message
                });
                this.results.failedTests++;
                resolve();
            });
            
            ws.on('close', (code) => {
                console.log(`🔌 CLOSED: ${endpoint} (code: ${code})\n`);
            });
        });
    }

    printResults() {
        console.log('📊 Test Results Summary:');
        console.log('================================');
        console.log(`Total Tests: ${this.results.totalTests}`);
        console.log(`Passed: ${this.results.passedTests}`);
        console.log(`Failed: ${this.results.failedTests}`);
        console.log(`Success Rate: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)}%\n`);
        
        console.log('📋 Detailed Results:');
        console.log('================================');
        
        for (const [endpoint, result] of this.results.endpoints) {
            const statusIcon = result.status === 'connected' ? '✅' : 
                             result.status === 'timeout' ? '⏰' : '❌';
            
            console.log(`${statusIcon} ${endpoint}`);
            console.log(`   Status: ${result.status}`);
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            
            if (result.messagesSent) {
                console.log(`   Messages Sent: ${result.messagesSent}`);
            }
            
            if (result.messagesReceived) {
                console.log(`   Messages Received: ${result.messagesReceived}`);
            }
            
            console.log('');
        }

        // Overall assessment
        if (this.results.passedTests === this.results.totalTests) {
            console.log('🎉 ALL TESTS PASSED! Phase 6 backend is fully operational.');
            console.log('✨ Frontend integration ready for development.');
        } else if (this.results.passedTests > 0) {
            console.log('⚠️  PARTIAL SUCCESS: Some endpoints are working.');
            console.log('🔧 Check failed endpoints and backend configuration.');
        } else {
            console.log('🚨 ALL TESTS FAILED: Phase 6 backend not accessible.');
            console.log('🔍 Verify backend is running on localhost:8080');
        }
    }
}

// Run tests if this is the main module
if (require.main === module) {
    const tester = new Phase6IntegrationTester();
    tester.runTests().catch(console.error);
}

module.exports = Phase6IntegrationTester;