/**
 * OCL Redux Slice
 * Global state management for OCL with real-time updates
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OCLState, OCLMessage, OCLThread, OCLSearchParams, OCLWebSocketEvent } from '../../types/ocl';

// Initial state
const initialState: OCLState = {
  messages: {
    items: [],
    loading: false,
    error: null,
    total: 0,
    hasNext: false,
  },
  threads: {
    items: [],
    loading: false,
    error: null,
    total: 0,
  },
  subscriptions: {
    items: [],
    loading: false,
    error: null,
  },
  stats: {
    data: null,
    loading: false,
    error: null,
  },
  performance: {
    data: null,
    loading: false,
    error: null,
  },
  websocket: {
    connected: false,
    reconnecting: false,
    error: null,
  },
  ui: {
    selectedMessage: null,
    selectedThread: null,
    searchParams: {},
    showAdvancedFilters: false,
  },
};

// OCL slice
export const oclSlice = createSlice({
  name: 'ocl',
  initialState,
  reducers: {
    // UI actions
    setSelectedMessage: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedMessage = action.payload;
    },

    setSelectedThread: (state, action: PayloadAction<string | null>) => {
      state.ui.selectedThread = action.payload;
    },

    setSearchParams: (state, action: PayloadAction<OCLSearchParams>) => {
      state.ui.searchParams = action.payload;
    },

    toggleAdvancedFilters: (state) => {
      state.ui.showAdvancedFilters = !state.ui.showAdvancedFilters;
    },

    setShowAdvancedFilters: (state, action: PayloadAction<boolean>) => {
      state.ui.showAdvancedFilters = action.payload;
    },

    // WebSocket actions
    setWebSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.websocket.connected = action.payload;
      if (action.payload) {
        state.websocket.error = null;
        state.websocket.reconnecting = false;
      }
    },

    setWebSocketReconnecting: (state, action: PayloadAction<boolean>) => {
      state.websocket.reconnecting = action.payload;
    },

    setWebSocketError: (state, action: PayloadAction<string | null>) => {
      state.websocket.error = action.payload;
      if (action.payload) {
        state.websocket.connected = false;
      }
    },

    // Real-time message updates
    addMessage: (state, action: PayloadAction<OCLMessage>) => {
      const existingIndex = state.messages.items.findIndex(
        (msg) => msg.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        // Update existing message
        state.messages.items[existingIndex] = action.payload;
      } else {
        // Add new message at the beginning
        state.messages.items.unshift(action.payload);
        state.messages.total += 1;
      }
    },

    updateMessage: (state, action: PayloadAction<OCLMessage>) => {
      const index = state.messages.items.findIndex(
        (msg) => msg.id === action.payload.id
      );
      if (index >= 0) {
        state.messages.items[index] = action.payload;
      }
    },

    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages.items = state.messages.items.filter(
        (msg) => msg.id !== action.payload
      );
      state.messages.total = Math.max(0, state.messages.total - 1);
    },

    markMessageAsRead: (state, action: PayloadAction<{ id: string; isRead: boolean }>) => {
      const message = state.messages.items.find(msg => msg.id === action.payload.id);
      if (message) {
        message.is_read = action.payload.isRead;
        message.updated_at = new Date().toISOString();
      }
    },

    toggleMessageStar: (state, action: PayloadAction<string>) => {
      const message = state.messages.items.find(msg => msg.id === action.payload);
      if (message) {
        message.is_starred = !message.is_starred;
        message.updated_at = new Date().toISOString();
      }
    },

    // Bulk operations
    markMultipleAsRead: (state, action: PayloadAction<{ ids: string[]; isRead: boolean }>) => {
      const { ids, isRead } = action.payload;
      state.messages.items.forEach(message => {
        if (ids.includes(message.id)) {
          message.is_read = isRead;
          message.updated_at = new Date().toISOString();
        }
      });
    },

    archiveMultipleMessages: (state, action: PayloadAction<string[]>) => {
      state.messages.items.forEach(message => {
        if (action.payload.includes(message.id)) {
          message.is_archived = true;
          message.updated_at = new Date().toISOString();
        }
      });
    },

    // Thread updates
    addThread: (state, action: PayloadAction<OCLThread>) => {
      const existingIndex = state.threads.items.findIndex(
        (thread) => thread.id === action.payload.id
      );
      
      if (existingIndex >= 0) {
        state.threads.items[existingIndex] = action.payload;
      } else {
        state.threads.items.unshift(action.payload);
        state.threads.total += 1;
      }
    },

    updateThread: (state, action: PayloadAction<OCLThread>) => {
      const index = state.threads.items.findIndex(
        (thread) => thread.id === action.payload.id
      );
      if (index >= 0) {
        state.threads.items[index] = action.payload;
      }
    },

    // WebSocket event handling
    handleWebSocketEvent: (state, action: PayloadAction<OCLWebSocketEvent>) => {
      const { event, payload } = action.payload;
      
      switch (event) {
        case 'new_message':
          if (payload.message) {
            oclSlice.caseReducers.addMessage(state, { 
              payload: payload.message, 
              type: 'ocl/addMessage' 
            });
          }
          break;
          
        case 'message_updated':
          if (payload.message) {
            oclSlice.caseReducers.updateMessage(state, { 
              payload: payload.message, 
              type: 'ocl/updateMessage' 
            });
          }
          break;
          
        case 'thread_updated':
          if (payload.thread) {
            oclSlice.caseReducers.updateThread(state, { 
              payload: payload.thread, 
              type: 'ocl/updateThread' 
            });
          }
          break;
          
        case 'subscription_triggered':
          // Handle subscription trigger notifications
          console.log('Subscription triggered:', payload.subscription);
          break;
      }
    },

    // Error handling
    setMessagesError: (state, action: PayloadAction<string | null>) => {
      state.messages.error = action.payload;
      state.messages.loading = false;
    },

    setThreadsError: (state, action: PayloadAction<string | null>) => {
      state.threads.error = action.payload;
      state.threads.loading = false;
    },

    setSubscriptionsError: (state, action: PayloadAction<string | null>) => {
      state.subscriptions.error = action.payload;
      state.subscriptions.loading = false;
    },

    // Clear errors
    clearErrors: (state) => {
      state.messages.error = null;
      state.threads.error = null;
      state.subscriptions.error = null;
      state.stats.error = null;
      state.performance.error = null;
      state.websocket.error = null;
    },

    // Reset state
    resetOCLState: () => initialState,
  },
});

// Export actions
export const {
  setSelectedMessage,
  setSelectedThread,
  setSearchParams,
  toggleAdvancedFilters,
  setShowAdvancedFilters,
  setWebSocketConnected,
  setWebSocketReconnecting,
  setWebSocketError,
  addMessage,
  updateMessage,
  removeMessage,
  markMessageAsRead,
  toggleMessageStar,
  markMultipleAsRead,
  archiveMultipleMessages,
  addThread,
  updateThread,
  handleWebSocketEvent,
  setMessagesError,
  setThreadsError,
  setSubscriptionsError,
  clearErrors,
  resetOCLState,
} = oclSlice.actions;

// Selectors
export const selectOCLMessages = (state: { ocl: OCLState }) => state.ocl.messages;
export const selectOCLThreads = (state: { ocl: OCLState }) => state.ocl.threads;
export const selectOCLSubscriptions = (state: { ocl: OCLState }) => state.ocl.subscriptions;
export const selectOCLStats = (state: { ocl: OCLState }) => state.ocl.stats;
export const selectOCLPerformance = (state: { ocl: OCLState }) => state.ocl.performance;
export const selectOCLWebSocket = (state: { ocl: OCLState }) => state.ocl.websocket;
export const selectOCLUI = (state: { ocl: OCLState }) => state.ocl.ui;

// Advanced selectors
export const selectSelectedMessage = (state: { ocl: OCLState }) => {
  const selectedId = state.ocl.ui.selectedMessage;
  return selectedId ? state.ocl.messages.items.find(msg => msg.id === selectedId) : null;
};

export const selectUnreadMessages = (state: { ocl: OCLState }) => 
  state.ocl.messages.items.filter(msg => !msg.is_read);

export const selectStarredMessages = (state: { ocl: OCLState }) => 
  state.ocl.messages.items.filter(msg => msg.is_starred);

export const selectMessagesByThread = (state: { ocl: OCLState }, threadId: string) => 
  state.ocl.messages.items.filter(msg => msg.thread_id === threadId);

export const selectMessagesByPriority = (state: { ocl: OCLState }, priority: string) => 
  state.ocl.messages.items.filter(msg => msg.priority === priority);

export const selectActiveSubscriptions = (state: { ocl: OCLState }) => 
  state.ocl.subscriptions.items.filter(sub => sub.is_active);

// Export reducer
export default oclSlice.reducer;