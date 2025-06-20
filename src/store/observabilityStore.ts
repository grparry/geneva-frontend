import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  SystemMetrics, 
  AgentMetrics, 
  AgentExecution, 
  StreamEntry, 
  Conversation, 
  ExecutionContext,
  Alert
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
  
  // Executions
  executions: Map<string, AgentExecution>;
  selectedExecution: string | null;
  executionContexts: Map<string, ExecutionContext>;
  
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
    executions: boolean;
    conversations: boolean;
    executionContext: boolean;
  };
  
  // Error states
  errors: {
    systemMetrics: string | null;
    agents: string | null;
    executions: string | null;
    conversations: string | null;
    executionContext: string | null;
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
  
  // Execution actions
  loadExecutions: (agentId?: string, timeRange?: string) => Promise<void>;
  updateExecution: (execution: AgentExecution) => void;
  selectExecution: (executionId: string | null) => void;
  loadExecutionContext: (executionId: string) => Promise<void>;
  
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
  executions: new Map(),
  selectedExecution: null,
  executionContexts: new Map(),
  conversations: new Map(),
  selectedConversation: null,
  streamCache: new Map(),
  alerts: [],
  unreadAlertCount: 0,
  loading: {
    systemMetrics: false,
    agents: false,
    executions: false,
    conversations: false,
    executionContext: false
  },
  errors: {
    systemMetrics: null,
    agents: null,
    executions: null,
    conversations: null,
    executionContext: null
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
          // Mock data for now - replace with: const data = await api.getSystemHealth();
          const mockMetrics: SystemMetrics = {
            totalCommunications: 1247,
            activeExecutions: 8,
            successRate: 94.2,
            avgResponseTime: 1.2,
            lastUpdated: new Date().toISOString()
          };
          
          set((state) => ({
            systemMetrics: mockMetrics,
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
          // Mock data for now
          const mockAgents: AgentMetrics[] = [
            {
              agentId: 'claude-agent-1',
              name: 'Claude Primary',
              status: 'active',
              executionCount: 47,
              successRate: 94.2,
              lastActivity: '2 minutes ago',
              avgResponseTime: 1.2
            },
            {
              agentId: 'memory-service',
              name: 'Memory Service',
              status: 'active',
              executionCount: 156,
              successRate: 98.1,
              lastActivity: '30 seconds ago',
              avgResponseTime: 0.8
            }
          ];
          
          const agentsMap = new Map();
          mockAgents.forEach(agent => agentsMap.set(agent.agentId, agent));
          
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
      
      // Execution actions
      loadExecutions: async (agentId?: string, timeRange = '24h') => {
        set((state) => ({ 
          loading: { ...state.loading, executions: true },
          errors: { ...state.errors, executions: null }
        }));
        
        try {
          // Mock data for now
          const mockExecutions: AgentExecution[] = [
            {
              execution_id: 'exec-001',
              agent_id: agentId || 'claude-agent-1',
              conversation_id: 'conv-001',
              started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              completed_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
              status: 'completed',
              action: 'Code Generation Task',
              duration_ms: 300000,
              has_claude_execution: true,
              message_count: 15,
              success_rate: 0.95
            }
          ];
          
          const executionsMap = new Map();
          mockExecutions.forEach(exec => executionsMap.set(exec.execution_id, exec));
          
          set((state) => ({
            executions: executionsMap,
            loading: { ...state.loading, executions: false }
          }));
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, executions: false },
            errors: { ...state.errors, executions: (error as Error).message }
          }));
        }
      },
      
      updateExecution: (execution: AgentExecution) => {
        set((state) => {
          const newExecutions = new Map(state.executions);
          newExecutions.set(execution.execution_id, execution);
          return { executions: newExecutions };
        });
      },
      
      selectExecution: (executionId: string | null) => {
        set({ selectedExecution: executionId });
        
        // Auto-load execution context when selected
        if (executionId) {
          get().loadExecutionContext(executionId);
        }
      },
      
      loadExecutionContext: async (executionId: string) => {
        set((state) => ({ 
          loading: { ...state.loading, executionContext: true },
          errors: { ...state.errors, executionContext: null }
        }));
        
        try {
          // Mock data for now - replace with: const data = await api.getExecutionContext(executionId);
          const mockContext: ExecutionContext = {
            context_id: 'ctx-001',
            execution_id: executionId,
            working_directory: '/Users/Geneva/Documents/0_substrate/Geneva',
            git_repository: 'https://github.com/geneva/platform.git',
            initial_files: ['src/api/app.py', 'requirements.txt'],
            modified_files: ['src/api/app.py'],
            created_files: ['src/observability/stream_monitor.py'],
            deleted_files: [],
            environment_variables: {
              'NODE_ENV': 'development',
              'REACT_APP_API_URL': 'http://localhost:8000'
            },
            tool_availability: ['Read', 'Write', 'Edit', 'Bash'],
            memory_context: {
              'project_type': 'React + FastAPI',
              'current_task': 'Communication stream enhancement'
            },
            final_state: {
              'status': 'completed',
              'files_changed': 3
            }
          };
          
          set((state) => {
            const newContexts = new Map(state.executionContexts);
            newContexts.set(executionId, mockContext);
            return {
              executionContexts: newContexts,
              loading: { ...state.loading, executionContext: false }
            };
          });
        } catch (error) {
          set((state) => ({
            loading: { ...state.loading, executionContext: false },
            errors: { ...state.errors, executionContext: (error as Error).message }
          }));
        }
      },
      
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