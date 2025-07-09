/**
 * OCL API Client using RTK Query
 * Provides type-safe API calls and caching for OCL operations
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  OCLMessage,
  OCLThread,
  OCLSubscription,
  OCLMessagesResponse,
  OCLThreadsResponse,
  OCLSubscriptionsResponse,
  OCLSearchParams,
  OCLStats,
  OCLPerformanceMetrics,
} from '../../types/ocl';

// Base query configuration
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/ocl',
  prepareHeaders: (headers, { getState }) => {
    // Add authentication headers if needed
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// OCL API definition
export const oclApi = createApi({
  reducerPath: 'oclApi',
  baseQuery,
  tagTypes: ['Message', 'Thread', 'Subscription', 'Stats', 'Performance'],
  endpoints: (builder) => ({
    // Message endpoints
    getMessages: builder.query<OCLMessagesResponse, {
      projectId?: string;
      page?: number;
      limit?: number;
      filters?: OCLSearchParams;
    }>({
      query: ({ projectId, page = 1, limit = 50, filters = {} }) => ({
        url: '/messages',
        params: {
          project_id: projectId,
          page,
          limit,
          ...filters,
        },
      }),
      providesTags: ['Message'],
    }),

    getMessage: builder.query<OCLMessage, { messageId: string }>({
      query: ({ messageId }) => `/messages/${messageId}`,
      providesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
      ],
    }),

    searchMessages: builder.mutation<OCLMessagesResponse, OCLSearchParams>({
      query: (searchParams) => ({
        url: '/messages/search',
        method: 'POST',
        body: searchParams,
      }),
      invalidatesTags: ['Message'],
    }),

    markMessageRead: builder.mutation<void, { messageId: string; isRead?: boolean }>({
      query: ({ messageId, isRead = true }) => ({
        url: `/messages/${messageId}/read`,
        method: 'PATCH',
        body: { is_read: isRead },
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
        'Message',
      ],
    }),

    starMessage: builder.mutation<void, { messageId: string; starred: boolean }>({
      query: ({ messageId, starred }) => ({
        url: `/messages/${messageId}/star`,
        method: 'PATCH',
        body: { is_starred: starred },
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
        'Message',
      ],
    }),

    archiveMessage: builder.mutation<void, { messageId: string }>({
      query: ({ messageId }) => ({
        url: `/messages/${messageId}/archive`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
        'Message',
      ],
    }),

    deleteMessage: builder.mutation<void, { messageId: string }>({
      query: ({ messageId }) => ({
        url: `/messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Message'],
    }),

    assignMessage: builder.mutation<void, { messageId: string; agentId: string }>({
      query: ({ messageId, agentId }) => ({
        url: `/messages/${messageId}/assign`,
        method: 'PATCH',
        body: { agent_id: agentId },
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
        'Message',
      ],
    }),

    // Thread endpoints
    getThreads: builder.query<OCLThreadsResponse, {
      projectId?: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ projectId, page = 1, limit = 50 }) => ({
        url: '/threads',
        params: {
          project_id: projectId,
          page,
          limit,
        },
      }),
      providesTags: ['Thread'],
    }),

    getThread: builder.query<OCLThread, { threadId: string }>({
      query: ({ threadId }) => `/threads/${threadId}`,
      providesTags: (result, error, { threadId }) => [
        { type: 'Thread', id: threadId },
      ],
    }),

    getThreadMessages: builder.query<OCLMessagesResponse, {
      threadId: string;
      page?: number;
      limit?: number;
    }>({
      query: ({ threadId, page = 1, limit = 50 }) => ({
        url: `/threads/${threadId}/messages`,
        params: { page, limit },
      }),
      providesTags: (result, error, { threadId }) => [
        { type: 'Thread', id: threadId },
        'Message',
      ],
    }),

    createThread: builder.mutation<OCLThread, {
      subject: string;
      projectId: string;
      participants?: string[];
    }>({
      query: (threadData) => ({
        url: '/threads',
        method: 'POST',
        body: threadData,
      }),
      invalidatesTags: ['Thread'],
    }),

    // Subscription endpoints
    getSubscriptions: builder.query<OCLSubscriptionsResponse, {
      projectId?: string;
      agentId?: string;
      activeOnly?: boolean;
    }>({
      query: ({ projectId, agentId, activeOnly = false }) => ({
        url: '/subscriptions',
        params: {
          project_id: projectId,
          agent_id: agentId,
          active_only: activeOnly,
        },
      }),
      providesTags: ['Subscription'],
    }),

    getSubscription: builder.query<OCLSubscription, { subscriptionId: string }>({
      query: ({ subscriptionId }) => `/subscriptions/${subscriptionId}`,
      providesTags: (result, error, { subscriptionId }) => [
        { type: 'Subscription', id: subscriptionId },
      ],
    }),

    createSubscription: builder.mutation<OCLSubscription, Partial<OCLSubscription>>({
      query: (subscriptionData) => ({
        url: '/subscriptions',
        method: 'POST',
        body: subscriptionData,
      }),
      invalidatesTags: ['Subscription'],
    }),

    updateSubscription: builder.mutation<OCLSubscription, {
      subscriptionId: string;
    } & Partial<OCLSubscription>>({
      query: ({ subscriptionId, ...updates }) => ({
        url: `/subscriptions/${subscriptionId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { subscriptionId }) => [
        { type: 'Subscription', id: subscriptionId },
        'Subscription',
      ],
    }),

    deleteSubscription: builder.mutation<void, { subscriptionId: string }>({
      query: ({ subscriptionId }) => ({
        url: `/subscriptions/${subscriptionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Subscription'],
    }),

    toggleSubscription: builder.mutation<void, {
      subscriptionId: string;
      enabled: boolean;
    }>({
      query: ({ subscriptionId, enabled }) => ({
        url: `/subscriptions/${subscriptionId}/toggle`,
        method: 'PATCH',
        body: { is_active: enabled },
      }),
      invalidatesTags: (result, error, { subscriptionId }) => [
        { type: 'Subscription', id: subscriptionId },
        'Subscription',
      ],
    }),

    testSubscription: builder.mutation<any, { subscriptionId: string }>({
      query: ({ subscriptionId }) => ({
        url: `/subscriptions/${subscriptionId}/test`,
        method: 'POST',
      }),
    }),

    // Analytics endpoints
    getStats: builder.query<OCLStats, { days?: number; projectId?: string }>({
      query: ({ days = 7, projectId }) => ({
        url: '/analytics/stats',
        params: {
          days,
          project_id: projectId,
        },
      }),
      providesTags: ['Stats'],
    }),

    getPerformanceMetrics: builder.query<OCLPerformanceMetrics, {
      duration?: string;
      projectId?: string;
    }>({
      query: ({ duration = '1h', projectId }) => ({
        url: '/analytics/performance',
        params: {
          duration,
          project_id: projectId,
        },
      }),
      providesTags: ['Performance'],
    }),

    exportData: builder.mutation<{ download_url: string }, {
      type: 'stats' | 'messages' | 'threads';
      format: 'csv' | 'json' | 'excel';
      filters?: Record<string, any>;
    }>({
      query: (exportParams) => ({
        url: '/analytics/export',
        method: 'POST',
        body: exportParams,
      }),
    }),

    // Utility endpoints
    getSourceTypes: builder.query<{ source_types: Array<{ name: string; message_count: number }> }, void>({
      query: () => '/metadata/source-types',
    }),

    getAvailableAgents: builder.query<{ agents: Array<{ id: string; name: string }> }, void>({
      query: () => '/metadata/agents',
    }),

    getLabels: builder.query<{ labels: Array<{ id: string; name: string; color: string }> }, void>({
      query: () => '/metadata/labels',
    }),

    // Advanced operations
    addLabel: builder.mutation<void, { messageId: string; labelId: string }>({
      query: ({ messageId, labelId }) => ({
        url: `/messages/${messageId}/labels`,
        method: 'POST',
        body: { label_id: labelId },
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
      ],
    }),

    removeLabelMutation: builder.mutation<void, { messageId: string; labelId: string }>({
      query: ({ messageId, labelId }) => ({
        url: `/messages/${messageId}/labels/${labelId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
      ],
    }),

    snoozeMessage: builder.mutation<void, { messageId: string; until: string }>({
      query: ({ messageId, until }) => ({
        url: `/messages/${messageId}/snooze`,
        method: 'PATCH',
        body: { snooze_until: until },
      }),
      invalidatesTags: (result, error, { messageId }) => [
        { type: 'Message', id: messageId },
        'Message',
      ],
    }),

    createTaskFromMessage: builder.mutation<any, {
      messageId: string;
      title: string;
      description: string;
      agent_id: string;
      priority: string;
      due_date?: string;
    }>({
      query: ({ messageId, ...taskData }) => ({
        url: `/messages/${messageId}/create-task`,
        method: 'POST',
        body: taskData,
      }),
    }),

    translateMessage: builder.mutation<{ translated_text: string }, {
      messageId: string;
      targetLanguage: string;
    }>({
      query: ({ messageId, targetLanguage }) => ({
        url: `/messages/${messageId}/translate`,
        method: 'POST',
        body: { target_language: targetLanguage },
      }),
    }),

    summarizeMessage: builder.mutation<{ summary: string }, { messageId: string }>({
      query: ({ messageId }) => ({
        url: `/messages/${messageId}/summarize`,
        method: 'POST',
      }),
    }),

    forwardMessage: builder.mutation<void, {
      messageId: string;
      to: string[];
      subject?: string;
      message?: string;
    }>({
      query: ({ messageId, ...forwardData }) => ({
        url: `/messages/${messageId}/forward`,
        method: 'POST',
        body: forwardData,
      }),
    }),

    replyToMessage: builder.mutation<void, {
      messageId: string;
      content: string;
      includeOriginal?: boolean;
      priority?: string;
    }>({
      query: ({ messageId, ...replyData }) => ({
        url: `/messages/${messageId}/reply`,
        method: 'POST',
        body: replyData,
      }),
      invalidatesTags: ['Message', 'Thread'],
    }),
  }),
});

// Export hooks for components
export const {
  // Message hooks
  useGetMessagesQuery,
  useGetMessageQuery,
  useSearchMessagesMutation,
  useMarkMessageReadMutation,
  useStarMessageMutation,
  useArchiveMessageMutation,
  useDeleteMessageMutation,
  useAssignMessageMutation,

  // Thread hooks
  useGetThreadsQuery,
  useGetThreadQuery,
  useGetThreadMessagesQuery,
  useCreateThreadMutation,

  // Subscription hooks
  useGetSubscriptionsQuery,
  useGetSubscriptionQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useToggleSubscriptionMutation,
  useTestSubscriptionMutation,

  // Analytics hooks
  useGetStatsQuery,
  useGetPerformanceMetricsQuery,
  useExportDataMutation,

  // Utility hooks
  useGetSourceTypesQuery,
  useGetAvailableAgentsQuery,
  useGetLabelsQuery,

  // Advanced operation hooks
  useAddLabelMutation,
  useRemoveLabelMutationMutation,
  useSnoozeMessageMutation,
  useCreateTaskFromMessageMutation,
  useTranslateMessageMutation,
  useSummarizeMessageMutation,
  useForwardMessageMutation,
  useReplyToMessageMutation,
} = oclApi;