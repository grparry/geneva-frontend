// Quick test to verify the project store functionality
// Run this in the browser console at http://localhost:8401/acorn/chat

console.log('=== Testing Project Store Functionality ===');

// Test that the store exists
if (window && window.__ZUSTAND_STORES__) {
  console.log('✅ Zustand stores are available');
} else {
  console.log('❌ Zustand stores not found');
}

// Test navigation to ACORN chat
console.log('✅ Navigate to: http://localhost:8401/acorn/chat');

// Test project context
console.log('✅ Expected behavior:');
console.log('1. Page should load without infinite loop errors');
console.log('2. Should show "Select Project" button if no context');
console.log('3. Should show project selector when button is clicked');
console.log('4. Should have mock customers: Geneva Development Team, Demo Organization');
console.log('5. Should have mock projects available after selecting customer');
console.log('6. "New Chat Room" button should be disabled until project is selected');

// Test error scenarios
console.log('✅ Error handling tests:');
console.log('1. Try creating chat room without selecting project (should show error)');
console.log('2. Select project and try creating room with no participants (should show error)');
console.log('3. Successfully create room after selecting project and participants');

console.log('=== End Test Instructions ===');