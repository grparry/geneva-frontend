/**
 * Redux Store Configuration
 * Central store setup including OCL integration
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { oclApi } from '../services/ocl/api';
import oclReducer from './ocl/slice';
import { cognitiveApi } from '../services/cognitive/api';
import cognitiveReducer from './cognitive/slice';

// Import existing store if it exists
let existingStore: any = null;
try {
  // Try to import existing store configuration
  const existingStoreModule = require('./types');
  existingStore = existingStoreModule.default || existingStoreModule;
} catch (error) {
  // No existing store, we'll create a new one
}

export const store = configureStore({
  reducer: {
    // OCL state management
    ocl: oclReducer,
    // OCL API state
    [oclApi.reducerPath]: oclApi.reducer,
    // Cognitive Memory state management
    cognitive: cognitiveReducer,
    // Cognitive API state
    [cognitiveApi.reducerPath]: cognitiveApi.reducer,
    // Include any existing reducers
    ...(existingStore?.getState ? {} : {}),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore RTK Query actions
          'oclApi/executeQuery/pending',
          'oclApi/executeQuery/fulfilled',
          'oclApi/executeQuery/rejected',
          'oclApi/executeMutation/pending',
          'oclApi/executeMutation/fulfilled',
          'oclApi/executeMutation/rejected',
          'cognitiveApi/executeQuery/pending',
          'cognitiveApi/executeQuery/fulfilled',
          'cognitiveApi/executeQuery/rejected',
          'cognitiveApi/executeMutation/pending',
          'cognitiveApi/executeMutation/fulfilled',
          'cognitiveApi/executeMutation/rejected',
        ],
        ignoredPaths: [
          // Ignore RTK Query state paths
          'oclApi.queries',
          'oclApi.mutations',
          'cognitiveApi.queries',
          'cognitiveApi.mutations',
        ],
      },
    }).concat(oclApi.middleware, cognitiveApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable listener behavior for RTK Query
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;