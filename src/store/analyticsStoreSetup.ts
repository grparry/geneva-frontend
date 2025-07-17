/**
 * Redux store setup for analytics API integration
 * 
 * This file provides the necessary configuration to add the analytics API
 * to your existing Redux store. Copy the relevant parts to your store setup.
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { analyticsApi } from '../api/analytics';
import { federationApi } from '../api/federation';

// Example store configuration with analytics and federation APIs
export const createStoreWithAnalytics = (existingReducers: any = {}) => {
  const store = configureStore({
    reducer: {
      // Add the analytics API reducer
      [analyticsApi.reducerPath]: analyticsApi.reducer,
      // Add the federation API reducer
      [federationApi.reducerPath]: federationApi.reducer,
      // Include your existing reducers
      ...existingReducers,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types for serialization checks
          ignoredActions: [
            'analyticsApi/executeQuery/fulfilled',
            'analyticsApi/executeQuery/rejected',
            'federationApi/executeQuery/fulfilled',
            'federationApi/executeQuery/rejected',
          ],
        },
      }).concat(analyticsApi.middleware, federationApi.middleware),
  });

  // Enable refetchOnFocus/refetchOnReconnect behaviors
  setupListeners(store.dispatch);

  return store;
};

// If you have an existing store, add these to your configuration:
export const analyticsStoreEnhancers = {
  reducer: {
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [federationApi.reducerPath]: federationApi.reducer,
  },
  middleware: [analyticsApi.middleware, federationApi.middleware],
};

// Type exports for TypeScript
export type RootState = ReturnType<ReturnType<typeof createStoreWithAnalytics>['getState']>;
export type AppDispatch = ReturnType<typeof createStoreWithAnalytics>['dispatch'];

/**
 * Instructions for integrating with existing store:
 * 
 * 1. In your existing store configuration file, import the APIs:
 *    import { analyticsApi } from '../services/analyticsApi';
 *    import { federationApi } from '../services/federationApi';
 * 
 * 2. Add the API reducers to your root reducer:
 *    reducer: {
 *      ...existingReducers,
 *      [analyticsApi.reducerPath]: analyticsApi.reducer,
 *      [federationApi.reducerPath]: federationApi.reducer,
 *    }
 * 
 * 3. Add the API middleware:
 *    middleware: (getDefaultMiddleware) =>
 *      getDefaultMiddleware().concat(analyticsApi.middleware, federationApi.middleware)
 * 
 * 4. Enable refetch listeners after creating the store:
 *    import { setupListeners } from '@reduxjs/toolkit/query';
 *    setupListeners(store.dispatch);
 */