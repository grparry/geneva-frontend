import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  SystemMetrics, 
  AgentMetrics, 
  AgentExecution, 
  StreamEntry, 
  Conversation, 
  ExecutionContext,
  Alert,
  HealthStatusResponse,
  SystemOverviewResponse
} from './types';
import { api } from '../api/client';


interface ObservabilityState {
  // System metrics
  systemMetrics: SystemMetrics | null;
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    websocket: 'connected' | 'disconnected' | 'reconnecting';
    memoryService: 'healthy' | 'warning' | 'error';
    agentFramework: 'running' | 'stopped' | 'error';
  };
  
  // Agents
  agents: Map<string, AgentMetrics>;
  selectedAgent: string | null;
  
  // Note: Executions not available in backend
  
  // Communications
  conversations: Map<string, Conversation>;
  selectedConversation: string | null;
  streamCache: Map<string, StreamEntry[]>;
  
  // Alerts
  alerts: Alert[];
  unreadAlertCount: number;
  
  // Loading states
  loading: {
    systemMetrics: boolean;
    agents: boolean;
    conversations: boolean;
  };
  
  // Error states
  errors: {
    systemMetrics: string | null;
    agents: string | null;
    conversations: string | null;
  };
}

interface ObservabilityActions {
  // System metrics actions
  loadSystemMetrics: () => Promise<void>;
  updateSystemMetrics: (metrics: Partial<SystemMetrics>) => void;
  updateSystemHealth: (component: keyof ObservabilityState['systemHealth'], status: string) => void;
  
  // Agent actions
  loadAgents: () => Promise<void>;
  updateAgent: (agentId: string, metrics: Partial<AgentMetrics>) => void;
  selectAgent: (agentId: string | null) => void;
  
  // Note: Execution endpoints don't exist in backend, removing phantom API methods
  
  // Communication actions
  loadConversations: (hours?: number) => Promise<void>;
  selectConversation: (conversationId: string | null) => void;
  loadStreamMessages: (conversationId: string, communicationType?: string) => Promise<void>;
  addStreamMessage: (conversationId: string, message: StreamEntry) => void;
  updateStreamCache: (conversationId: string, messages: StreamEntry[]) => void;
  
  // Alert actions
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  markAlertRead: (alertId: string) => void;
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Utility actions
  clearError: (key: keyof ObservabilityState['errors']) => void;
  reset: () => void;
}

type ObservabilityStore = ObservabilityState & ObservabilityActions;

const initialState: ObservabilityState = {
  systemMetrics: null,
  systemHealth: {
    database: 'healthy',
    websocket: 'connected',
    memoryService: 'healthy',
    agentFramework: 'running'
  },
  agents: new Map(),
  selectedAgent: null,
  conversations: new Map(),
  selectedConversation: null,
  streamCache: new Map(),
  alerts: [],
  unreadAlertCount: 0,
  loading: {
    systemMetrics: false,
    agents: false,
    conversations: false
  },
  errors: {
    systemMetrics: null,
    agents: null,
    conversations: null
  }
};

export const useObservabilityStore = create<ObservabilityStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,
      
      // System metrics actions
      loadSystemMetrics: async () => {
        set((state) => ({ 
          loading: { ...state.loading, systemMetrics: true },
          errors: { ...state.errors, systemMetrics: null }
        }));
        
        try {
          // Get real data from backend APIs
          const [healthData, overviewData] = await Promise.all([
            api.getSystemHealth(),
            api.getSystemOverview()
          ]);
          
          // Combine both API responses into SystemMetrics format
          const systemMetrics: SystemMetrics = {
            ...healthData,
            ...overviewData
          };
          
          set((state) => ({
            systemMetrics,
            loading: { ...state.loading, systemMetrics: false }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, systemMetrics: false },
            errors: { ...state.errors, systemMetrics: (error as Error).message }
          }));
        }
      },
      
      updateSystemMetrics: (metrics: Partial<SystemMetrics>) => {
        set((state) => ({
          systemMetrics: state.systemMetrics ? { ...state.systemMetrics, ...metrics } : null
        }));
      },
      
      updateSystemHealth: (component, status) => {
        set((state) => ({
          systemHealth: { ...state.systemHealth, [component]: status }
        }));
      },
      
      // Agent actions
      loadAgents: async () => {
        set((state) => ({ 
          loading: { ...state.loading, agents: true },
          errors: { ...state.errors, agents: null }
        }));
        
        try {
          // Get real agent data from backend
          const agents: AgentMetrics[] = await api.getTopAgents();
          
          const agentsMap = new Map();
          agents.forEach((agent: AgentMetrics) => {
            agentsMap.set(agent.agent_id, agent);
          });
          
          set((state) => ({
            agents: agentsMap,
            loading: { ...state.loading, agents: false }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, agents: false },
            errors: { ...state.errors, agents: (error as Error).message }
          }));
        }
      },
      
      updateAgent: (agentId: string, metrics: Partial<AgentMetrics>) => {
        set((state) => {
          const newAgents = new Map(state.agents);
          const existing = newAgents.get(agentId);
          if (existing) {
            newAgents.set(agentId, { ...existing, ...metrics });
          }
          return { agents: newAgents };
        });
      },
      
      selectAgent: (agentId: string | null) => {
        set({ selectedAgent: agentId });
      },
      
      // Note: Execution endpoints removed - not available in backend
      
      // Communication actions
      loadConversations: async (hours = 24) => {
        set((state) => ({ 
          loading: { ...state.loading, conversations: true },
          errors: { ...state.errors, conversations: null }
        }));
        
        try {
          const data = await api.getRecentConversations(hours);
          const conversationsMap = new Map();
          (data.conversations || []).forEach((conv: Conversation) => 
            conversationsMap.set(conv.conversation_id, conv)
          );
          
          set((state) => ({
            conversations: conversationsMap,
            loading: { ...state.loading, conversations: false }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, conversations: false },
            errors: { ...state.errors, conversations: (error as Error).message }
          }));
        }
      },
      
      selectConversation: (conversationId: string | null) => {
        set({ selectedConversation: conversationId });
        
        // Auto-load stream messages when conversation selected
        if (conversationId) {
          get().loadStreamMessages(conversationId);
        }
      },
      
      loadStreamMessages: async (conversationId: string, communicationType?: string) => {
        try {
          const data = await api.getStream(conversationId, communicationType);
          set((state) => {
            const newStreamCache = new Map(state.streamCache);
            newStreamCache.set(conversationId, data.messages || []);
            return { streamCache: newStreamCache };
          });
        } catch (error) {
          console.error('Failed to load stream messages:', error);
        }
      },
      
      addStreamMessage: (conversationId: string, message: StreamEntry) => {
        set((state) => {
          const newStreamCache = new Map(state.streamCache);
          const existing = newStreamCache.get(conversationId) || [];
          newStreamCache.set(conversationId, [...existing, message]);
          return { streamCache: newStreamCache };
        });
      },
      
      updateStreamCache: (conversationId: string, messages: StreamEntry[]) => {
        set((state) => {
          const newStreamCache = new Map(state.streamCache);
          newStreamCache.set(conversationId, messages);
          return { streamCache: newStreamCache };
        });
      },
      
      // Alert actions
      addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => {
        const newAlert: Alert = {
          ...alert,
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        };
        
        set((state) => ({
          alerts: [newAlert, ...state.alerts],
          unreadAlertCount: state.unreadAlertCount + 1
        }));
      },
      
      markAlertRead: (alertId: string) => {
        set((state) => ({
          alerts: state.alerts.map(alert => 
            alert.id === alertId ? { ...alert, read: true } : alert
          ),
          unreadAlertCount: Math.max(0, state.unreadAlertCount - 1)
        }));
      },
      
      clearAlert: (alertId: string) => {
        set((state) => {
          const alertToRemove = state.alerts.find(alert => alert.id === alertId);
          return {
            alerts: state.alerts.filter(alert => alert.id !== alertId),
            unreadAlertCount: alertToRemove && !alertToRemove.read 
              ? Math.max(0, state.unreadAlertCount - 1) 
              : state.unreadAlertCount
          };
        });
      },
      
      clearAllAlerts: () => {
        set({ alerts: [], unreadAlertCount: 0 });
      },
      
      // Utility actions
      clearError: (key: keyof ObservabilityState['errors']) => {
        set((state) => ({
          errors: { ...state.errors, [key]: null }
        }));
      },
      
      reset: () => {
        set(initialState);
      }
    })),
    { name: 'observability-store' }
  )
);