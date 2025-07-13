# Frontend Tests

This directory contains test scripts for the Geneva frontend WebSocket integration.

## Test Files

- `test_correct_endpoints.js` - WebSocket endpoint validation
- `test_fresh_room.js` - Chat room creation testing
- `test_new_room.js` - New room functionality testing  
- `test_working_websocket.js` - WebSocket connectivity validation

## Root Level Tests (Kept for Integration)

- `test_phase6_integration.js` - Phase 6 integration test suite
- `test_websocket_client.js` - Complete WebSocket client testing
- `test_worker_progress_ws.js` - Worker progress WebSocket testing
- `test_worker_progress.html` - HTML test interface
- `simple_websocket_test.html` - Simple test page

## Usage

Run tests using Node.js:
```bash
node test_phase6_integration.js
node test_websocket_client.js
```

## Requirements

- Geneva API server running on port 8080
- WebSocket dependencies: `ws` package