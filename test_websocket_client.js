/**
 * Simple WebSocket test client for Geneva Phase 6 backend
 * Tests real-time progress streaming and multi-agent coordination
 */

const WebSocket = require('ws');

class GenevaWebSocketTester {
    constructor(serverUrl = 'ws://localhost:8080') {
        this.serverUrl = serverUrl;
        this.ws = null;
        this.subscriptions = new Map();
        this.messageCount = 0;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`Connecting to Geneva backend at ${this.serverUrl}/ws/coordination`);
            
            this.ws = new WebSocket(`${this.serverUrl}/ws/coordination`);
            
            this.ws.on('open', () => {
                console.log('✅ WebSocket connected successfully');
                resolve();
            });
            
            this.ws.on('message', (data) => {
                this.handleMessage(data);
            });
            
            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error.message);
                reject(error);
            });
            
            this.ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
            });
        });
    }

    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            this.messageCount++;
            
            console.log(`📨 Message ${this.messageCount}:`, {
                type: message.type,
                event_type: message.event_type,
                scope: message.scope,
                timestamp: message.timestamp
            });
            
            // Log specific event types
            switch (message.event_type) {
                case 'tool_progress':
                    console.log('🔧 Tool Progress:', message.data);
                    break;
                case 'agent_communication':
                    console.log('🤖 Agent Communication:', message.data);
                    break;
                case 'coordination_event':
                    console.log('🔄 Coordination Event:', message.data);
                    break;
                case 'handoff_status':
                    console.log('↪️  Handoff Status:', message.data);
                    break;
                default:
                    console.log('📄 Event Data:', message.data);
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error.message);
        }
    }

    subscribe(scope, scopeId, eventTypes) {
        const subscription = {
            action: 'subscribe',
            scope: scope,
            scope_id: scopeId,
            event_types: eventTypes
        };
        
        console.log('🔔 Subscribing to events:', subscription);
        this.ws.send(JSON.stringify(subscription));
        
        this.subscriptions.set(`${scope}:${scopeId}`, subscription);
    }

    async testPhase6Capabilities() {
        console.log('\n🧪 Testing Phase 6 Backend Capabilities...\n');
        
        try {
            await this.connect();
            
            // Test 1: Subscribe to global coordination events
            console.log('1️⃣ Testing global coordination event subscription');
            this.subscribe('global', '*', ['coordination_event', 'system_status']);
            
            await this.sleep(2000);
            
            // Test 2: Subscribe to workflow-specific events
            console.log('\n2️⃣ Testing workflow-specific event subscription');
            this.subscribe('workflow', 'test-workflow-123', ['tool_progress', 'workflow_update']);
            
            await this.sleep(2000);
            
            // Test 3: Subscribe to agent communication
            console.log('\n3️⃣ Testing agent communication subscription');
            this.subscribe('agent', 'digby_claude_code', ['agent_communication', 'handoff_status']);
            
            await this.sleep(2000);
            
            // Test 4: Subscribe to user-specific events
            console.log('\n4️⃣ Testing user-specific event subscription');
            this.subscribe('user', 'developer', ['error_notification']);
            
            console.log('\n⏱️  Listening for events for 30 seconds...');
            await this.sleep(30000);
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        } finally {
            this.close();
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// API Testing Helper
class GenevaAPITester {
    constructor(baseUrl = 'http://localhost:8080') {
        this.baseUrl = baseUrl;
    }

    async testAPI(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            console.log(`📡 Testing ${method} ${url}`);
            const response = await fetch(url);
            
            console.log(`📊 Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const responseData = await response.text();
                try {
                    const parsed = JSON.parse(responseData);
                    console.log('✅ Response:', parsed);
                    return parsed;
                } catch {
                    console.log('✅ Response (text):', responseData);
                    return responseData;
                }
            } else {
                console.error('❌ Request failed');
                return null;
            }
        } catch (error) {
            console.error('❌ Network error:', error.message);
            return null;
        }
    }

    async testPhase6APIs() {
        console.log('\n🌐 Testing Phase 6 API Endpoints...\n');
        
        // Test basic endpoints
        await this.testAPI('/health');
        await this.testAPI('/api/health');
        await this.testAPI('/docs');
        
        // Test agent endpoints
        await this.testAPI('/api/agents');
        await this.testAPI('/api/agents/digby_claude_code');
        
        // Test workflow endpoints  
        await this.testAPI('/api/workflows');
        
        // Test coordination endpoints
        await this.testAPI('/api/coordination/sessions');
        await this.testAPI('/api/coordination/agents');
        
        console.log('\n📋 API testing complete');
    }
}

// Main execution
async function main() {
    console.log('🚀 Geneva Phase 6 Backend Test Suite\n');
    
    // Test API first
    const apiTester = new GenevaAPITester();
    await apiTester.testPhase6APIs();
    
    // Then test WebSocket
    const wsTester = new GenevaWebSocketTester();
    await wsTester.testPhase6Capabilities();
    
    console.log('\n✅ All tests completed');
}

// Run if this is the main module
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { GenevaWebSocketTester, GenevaAPITester };