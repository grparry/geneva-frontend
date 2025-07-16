/**
 * Federation API Service
 * 
 * RTK Query API service for all federation-related endpoints.
 * Extends existing Geneva API patterns for consistency.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import {
  SubstratePeer,
  Delegation,
  DelegationResult,
  TrustRelationship,
  TrustAuditEntry,
  CertificateInfo,
  FederationMetrics,
  FederationHealth,
  DelegateTaskRequest,
  TrustUpgradeRequest,
  AuditLogEntry,
  CertificateValidation,
  FederationApiResponse,
  PaginatedResponse,
  PeerStatus,
  DelegationStatus,
  TrustLevel,
} from '../types/federation';

// Base query with retry logic (following existing Geneva patterns)
const baseQueryWithRetry: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Add authentication headers if available
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  });

  let result = await baseQuery(args, api, extraOptions);
  
  // Retry logic for network errors
  if (result.error && result.error.status === 'FETCH_ERROR') {
    // Retry once after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    result = await baseQuery(args, api, extraOptions);
  }
  
  return result;
};

export const federationApi = createApi({
  reducerPath: 'federationApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Peers', 'Delegations', 'Trust', 'Metrics', 'Audit', 'Health'],
  endpoints: (builder) => ({
    
    // ===================
    // PEER MANAGEMENT
    // ===================
    
    getPeers: builder.query<SubstratePeer[], { 
      status?: PeerStatus;
      trustLevel?: TrustLevel;
      limit?: number;
      offset?: number;
    }>({
      query: ({ status, trustLevel, limit, offset }) => ({
        url: '/federation/peers',
        params: {
          ...(status && { status }),
          ...(trustLevel && { trust_level: trustLevel }),
          ...(limit && { limit }),
          ...(offset && { offset }),
        },
      }),
      providesTags: ['Peers'],
      transformResponse: (response: FederationApiResponse<SubstratePeer[]>) => response.data,
    }),
    
    getPeer: builder.query<SubstratePeer, string>({
      query: (peerId) => `/federation/peers/${peerId}`,
      providesTags: (result, error, id) => [{ type: 'Peers', id }],
      transformResponse: (response: FederationApiResponse<SubstratePeer>) => response.data,
    }),
    
    discoverPeer: builder.mutation<SubstratePeer, { peer_url: string }>({
      query: (body) => ({
        url: '/federation/discover',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Peers'],
      transformResponse: (response: FederationApiResponse<SubstratePeer>) => response.data,
    }),
    
    updatePeerStatus: builder.mutation<void, { 
      peer_id: string; 
      status: PeerStatus;
      reason?: string;
    }>({
      query: ({ peer_id, status, reason }) => ({
        url: `/federation/peers/${peer_id}/status`,
        method: 'PUT',
        body: { status, reason },
      }),
      invalidatesTags: (result, error, { peer_id }) => [
        'Peers',
        { type: 'Peers', id: peer_id },
      ],
    }),
    
    refreshPeer: builder.mutation<SubstratePeer, string>({
      query: (peerId) => ({
        url: `/federation/peers/${peerId}/refresh`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, peerId) => [
        'Peers',
        { type: 'Peers', id: peerId },
      ],
      transformResponse: (response: FederationApiResponse<SubstratePeer>) => response.data,
    }),
    
    getPeerCapabilities: builder.query<Record<string, any>, string>({
      query: (peerId) => `/federation/peers/${peerId}/capabilities`,
      providesTags: (result, error, id) => [{ type: 'Peers', id: `${id}-capabilities` }],
      transformResponse: (response: FederationApiResponse<Record<string, any>>) => response.data,
    }),
    
    // ===================
    // DELEGATION MANAGEMENT
    // ===================
    
    getDelegations: builder.query<PaginatedResponse<Delegation>, {
      status?: DelegationStatus;
      source_substrate?: string;
      target_substrate?: string;
      task_type?: string;
      limit?: number;
      offset?: number;
    }>({
      query: (params) => ({
        url: '/federation/delegations',
        params,
      }),
      providesTags: ['Delegations'],
      transformResponse: (response: FederationApiResponse<PaginatedResponse<Delegation>>) => response.data,
    }),
    
    getDelegation: builder.query<Delegation, string>({
      query: (delegationId) => `/federation/delegations/${delegationId}`,
      providesTags: (result, error, id) => [{ type: 'Delegations', id }],
      transformResponse: (response: FederationApiResponse<Delegation>) => response.data,
    }),
    
    delegateTask: builder.mutation<Delegation, DelegateTaskRequest>({
      query: (body) => ({
        url: '/federation/delegate/task',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Delegations', 'Metrics'],
      transformResponse: (response: FederationApiResponse<Delegation>) => response.data,
    }),
    
    retryDelegation: builder.mutation<Delegation, { 
      delegation_id: string;
      target_substrate?: string;
    }>({
      query: ({ delegation_id, target_substrate }) => ({
        url: `/federation/delegations/${delegation_id}/retry`,
        method: 'POST',
        body: { target_substrate },
      }),
      invalidatesTags: (result, error, { delegation_id }) => [
        'Delegations',
        { type: 'Delegations', id: delegation_id },
      ],
      transformResponse: (response: FederationApiResponse<Delegation>) => response.data,
    }),
    
    cancelDelegation: builder.mutation<void, string>({
      query: (delegationId) => ({
        url: `/federation/delegations/${delegationId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, delegationId) => [
        'Delegations',
        { type: 'Delegations', id: delegationId },
      ],
    }),
    
    getDelegationResult: builder.query<DelegationResult, string>({
      query: (delegationId) => `/federation/delegations/${delegationId}/result`,
      providesTags: (result, error, id) => [{ type: 'Delegations', id: `${id}-result` }],
      transformResponse: (response: FederationApiResponse<DelegationResult>) => response.data,
    }),
    
    // ===================
    // TRUST MANAGEMENT
    // ===================
    
    getTrustRelationships: builder.query<TrustRelationship[], {
      source_substrate?: string;
      target_substrate?: string;
      trust_level?: TrustLevel;
    }>({
      query: (params) => ({
        url: '/federation/trust/relationships',
        params,
      }),
      providesTags: ['Trust'],
      transformResponse: (response: FederationApiResponse<TrustRelationship[]>) => response.data,
    }),
    
    getTrustRelationship: builder.query<TrustRelationship, {
      source_substrate: string;
      target_substrate: string;
    }>({
      query: ({ source_substrate, target_substrate }) => 
        `/federation/trust/relationships/${source_substrate}/${target_substrate}`,
      providesTags: (result, error, { source_substrate, target_substrate }) => [
        { type: 'Trust', id: `${source_substrate}-${target_substrate}` },
      ],
      transformResponse: (response: FederationApiResponse<TrustRelationship>) => response.data,
    }),
    
    updateTrustLevel: builder.mutation<void, { peer_id: string; trust_level: TrustLevel; reason?: string }>({
      query: (body) => ({
        url: '/federation/trust/update',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Trust', 'Peers', 'Audit'],
    }),

    upgradeTrust: builder.mutation<void, TrustUpgradeRequest>({
      query: (body) => ({
        url: '/federation/trust/upgrade',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Trust', 'Peers'],
    }),

    getTrustAudit: builder.query<PaginatedResponse<TrustAuditEntry>, {
      limit?: number;
      offset?: number;
      timeRange?: { start: string; end: string };
    }>({
      query: (params) => ({
        url: '/federation/trust/audit',
        params,
      }),
      providesTags: ['Audit'],
      transformResponse: (response: FederationApiResponse<PaginatedResponse<TrustAuditEntry>>) => response.data,
    }),
    
    revokeTrust: builder.mutation<void, { 
      peer_id: string; 
      reason: string;
    }>({
      query: (body) => ({
        url: '/federation/trust/revoke',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Trust', 'Peers'],
    }),
    
    establishTrust: builder.mutation<TrustRelationship, {
      target_substrate: string;
      initial_trust_level?: TrustLevel;
      mutual?: boolean;
    }>({
      query: (body) => ({
        url: '/federation/trust/establish',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Trust', 'Peers'],
      transformResponse: (response: FederationApiResponse<TrustRelationship>) => response.data,
    }),
    
    // ===================
    // CERTIFICATE MANAGEMENT
    // ===================
    
    getCertificateInfo: builder.query<CertificateInfo, string>({
      query: (peerId) => `/federation/peers/${peerId}/certificate`,
      providesTags: (result, error, id) => [{ type: 'Peers', id: `${id}-certificate` }],
      transformResponse: (response: FederationApiResponse<CertificateInfo>) => response.data,
    }),
    
    validateCertificate: builder.mutation<CertificateValidation, string>({
      query: (peerId) => ({
        url: `/federation/peers/${peerId}/certificate/validate`,
        method: 'POST',
      }),
      transformResponse: (response: FederationApiResponse<CertificateValidation>) => response.data,
    }),
    
    renewCertificate: builder.mutation<CertificateInfo, string>({
      query: (peerId) => ({
        url: `/federation/peers/${peerId}/certificate/renew`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, peerId) => [
        { type: 'Peers', id: `${peerId}-certificate` },
      ],
      transformResponse: (response: FederationApiResponse<CertificateInfo>) => response.data,
    }),
    
    // ===================
    // METRICS AND MONITORING
    // ===================
    
    getFederationMetrics: builder.query<FederationMetrics, {
      timeRange?: { start: string; end: string };
    }>({
      query: (params) => ({
        url: '/federation/metrics',
        params,
      }),
      providesTags: ['Metrics'],
      transformResponse: (response: FederationApiResponse<FederationMetrics>) => response.data,
    }),
    
    getFederationHealth: builder.query<FederationHealth, void>({
      query: () => '/federation/health',
      providesTags: ['Health'],
      transformResponse: (response: FederationApiResponse<FederationHealth>) => response.data,
    }),
    
    // ===================
    // AUDIT AND SECURITY
    // ===================
    
    getAuditLog: builder.query<PaginatedResponse<AuditLogEntry>, {
      resource?: string;
      action?: string;
      userId?: string;
      outcome?: 'success' | 'failure';
      timeRange?: { start: string; end: string };
      limit?: number;
      offset?: number;
    }>({
      query: (params) => ({
        url: '/federation/audit',
        params,
      }),
      providesTags: ['Audit'],
      transformResponse: (response: FederationApiResponse<PaginatedResponse<AuditLogEntry>>) => response.data,
    }),
    
    // ===================
    // UTILITY ENDPOINTS
    // ===================
    
    getWellKnownMcp: builder.query<Record<string, any>, string>({
      query: (peerUrl) => ({
        url: `${peerUrl}/.well-known/mcp-context`,
        // This is an external call, so we need to handle CORS
      }),
      transformResponse: (response: any) => response,
    }),
    
    testPeerConnection: builder.mutation<{ success: boolean; latency: number }, string>({
      query: (peerUrl) => ({
        url: '/federation/test-connection',
        method: 'POST',
        body: { peer_url: peerUrl },
      }),
      transformResponse: (response: FederationApiResponse<{ success: boolean; latency: number }>) => response.data,
    }),
    
  }),
});

// Export hooks for all endpoints
export const {
  // Peer management hooks
  useGetPeersQuery,
  useGetPeerQuery,
  useDiscoverPeerMutation,
  useUpdatePeerStatusMutation,
  useRefreshPeerMutation,
  useGetPeerCapabilitiesQuery,
  
  // Delegation management hooks
  useGetDelegationsQuery,
  useGetDelegationQuery,
  useDelegateTaskMutation,
  useRetryDelegationMutation,
  useCancelDelegationMutation,
  useGetDelegationResultQuery,
  
  // Trust management hooks
  useGetTrustRelationshipsQuery,
  useGetTrustRelationshipQuery,
  useUpdateTrustLevelMutation,
  useUpgradeTrustMutation,
  useRevokeTrustMutation,
  useEstablishTrustMutation,
  
  // Certificate management hooks
  useGetCertificateInfoQuery,
  useValidateCertificateMutation,
  useRenewCertificateMutation,
  
  // Metrics and monitoring hooks
  useGetFederationMetricsQuery,
  useGetFederationHealthQuery,
  
  // Audit and security hooks
  useGetAuditLogQuery,
  
  // Utility hooks
  useGetWellKnownMcpQuery,
  useTestPeerConnectionMutation,
} = federationApi;

// Export the API for store configuration
export default federationApi;