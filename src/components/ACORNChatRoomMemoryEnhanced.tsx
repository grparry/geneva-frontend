import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Typography, TextField, Button, Avatar, Chip, List, ListItem, ListItemAvatar, ListItemText, Divider, IconButton, CircularProgress, Tabs, Tab, Snackbar, Alert, Stack, Drawer } from '@mui/material';
import { 
  Send as SendIcon, 
  Add as AddIcon, 
  Close as CloseIcon, 
  Psychology as PsychologyIcon, 
  Memory as MemoryIcon, 
  Code as CodeIcon, 
  Search as SearchIcon, 
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Assignment as TaskIcon,
  Speed as SpeedIcon,
  MenuBook as MemoryPanelIcon
} from '@mui/icons-material';
import { useWebSocketSimple } from '../hooks/useWebSocketSimple';
import { SUPERADMIN_CUSTOMER_ID } from '../constants/tenant';
import { ClaudeProgressBar, ProgressStage } from './claude/progress/ClaudeProgressBar';
import { useClaudeProgress } from '../hooks/useClaudeProgress';
import { ClarificationDialog } from './claude/clarification/ClarificationDialog';
import { ClarificationNotification, ClarificationIndicator } from './claude/clarification/ClarificationNotification';
import { useClarificationManager } from '../hooks/useClarificationManager';
import { ClarificationRequest } from '../types/clarification';
import { MultiModalViewer } from './claude/multimodal/MultiModalViewer';
import { MediaUpload } from './claude/multimodal/MediaUpload';
import { AnyMediaItem, MultiModalContext } from '../types/multimodal';
import { CapabilityBrowser } from './claude/capabilities/CapabilityBrowser';
import { TaskFeasibilityChecker } from './claude/capabilities/TaskFeasibilityChecker';
import { CapabilityHints } from './claude/capabilities/CapabilityHints';
import { useCapabilityManager } from '../hooks/useCapabilityManager';
import { CapabilitySpec, CapabilityHint, TaskFeasibilityRequest } from '../types/capability';
import { InsightCard } from './claude/learning/InsightCard';
import { useLearningInsights } from '../hooks/useLearningInsights';
// Phase 4 Advanced Components
import { ConstraintValidator } from './claude/tools/ConstraintValidator';
import { CollaborativeEditor } from './claude/advanced/CollaborativeEditor';
import { TaskPlanner } from './claude/advanced/TaskPlanner';
import { PerformanceOverlay } from './claude/advanced/PerformanceOverlay';
// System Agent Integration
import { useSystemAgentIntegration } from '../hooks/useSystemAgentIntegration';
// Memory Enhancement Components
import { MemoryStatusIndicator } from './memory/MemoryStatusIndicator';
import { ConversationMemoryPanel } from './memory/ConversationMemoryPanel';
import { MemoryEnhancedMessage } from './memory/MemoryEnhancedMessage';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8400';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

interface Message {
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  user_id?: string;
  agent_id?: string;
  media_items?: AnyMediaItem[];
  // Memory enhancement fields
  memory_enhanced?: boolean;
  memory_context?: any[];
  learning_applied?: any[];
  cross_agent_insights?: string[];
}

interface InfrastructureEvent {
  type: string;
  agent_id?: string;
  room_id?: string;
  timestamp: string;
  [key: string]: any;
}

interface AgentProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  status: 'idle' | 'thinking' | 'responding';
  memory_stats?: {
    total_items: number;
    cache_hit_rate: number;
    last_learning: string;
  };
}

// System Agent profiles with memory enhancement indicators
const SYSTEM_AGENTS: Record<string, AgentProfile> = {
  thedra_codex: {
    id: 'thedra_codex',
    name: 'Thedra',
    title: 'Chief Memory Officer',
    avatar: '📚',
    color: '#6a1b9a',
    status: 'idle',
    memory_stats: {
      total_items: 47,
      cache_hit_rate: 0.89,
      last_learning: new Date().toISOString()
    }
  },
  greta_praxis: {
    id: 'greta_praxis',
    name: 'Greta',
    title: 'Chief Ontology Officer',
    avatar: '🔮',
    color: '#3f51b5',
    status: 'idle',
    memory_stats: {
      total_items: 23,
      cache_hit_rate: 0.84,
      last_learning: new Date().toISOString()
    }
  },
  bradley_sentinel: {
    id: 'bradley_sentinel',
    name: 'Bradley',
    title: 'Chief Security Officer',
    avatar: '🛡️',
    color: '#f44336',
    status: 'idle',
    memory_stats: {
      total_items: 31,
      cache_hit_rate: 0.92,
      last_learning: new Date().toISOString()
    }
  },
  digby_claude: {
    id: 'digby_claude',
    name: 'Digby',
    title: 'Chief Automation Officer',
    avatar: '⚡',
    color: '#ff9800',
    status: 'idle',
    memory_stats: {
      total_items: 18,
      cache_hit_rate: 0.87,
      last_learning: new Date().toISOString()
    }
  }
};

// ACORN Executive profiles (same as before)
const ACORN_EXECUTIVES: Record<string, AgentProfile> = {
  sloan_ceo: {
    id: 'sloan_ceo',
    name: 'Sloan',
    title: 'Chief Executive Officer',
    avatar: 'S',
    color: '#1976d2',
    status: 'idle'
  },
  mira_coo: {
    id: 'mira_coo',
    name: 'Mira',
    title: 'Chief Operating Officer',
    avatar: 'M',
    color: '#388e3c',
    status: 'idle'
  },
  erik_cdo: {
    id: 'erik_cdo',
    name: 'Erik',
    title: 'Chief Development Officer',
    avatar: 'E',
    color: '#7b1fa2',
    status: 'idle'
  },
  iris_cto: {
    id: 'iris_cto',
    name: 'Iris',
    title: 'Chief Technology Officer',
    avatar: 'I',
    color: '#c2185b',
    status: 'idle'
  },
  konrad_ciso: {
    id: 'konrad_ciso',
    name: 'Konrad',
    title: 'Chief Information Security Officer',
    avatar: 'K',
    color: '#d32f2f',
    status: 'idle'
  },
  kayla_cfo: {
    id: 'kayla_cfo',
    name: 'Kayla',
    title: 'Chief Financial Officer',
    avatar: 'K',
    color: '#f57c00',
    status: 'idle'
  },
  vesper_cmo: {
    id: 'vesper_cmo',
    name: 'Vesper',
    title: 'Chief Marketing Officer',
    avatar: 'V',
    color: '#689f38',
    status: 'idle'
  },
  taryn_cro_revenue: {
    id: 'taryn_cro_revenue',
    name: 'Taryn',
    title: 'Chief Revenue Officer',
    avatar: 'T',
    color: '#0288d1',
    status: 'idle'
  },
  digby_cro_research: {
    id: 'digby_cro_research',
    name: 'Digby',
    title: 'Chief Research Officer',
    avatar: 'D',
    color: '#5e35b1',
    status: 'idle'
  },
  kingsley_chief_of_staff: {
    id: 'kingsley_chief_of_staff',
    name: 'Kingsley',
    title: 'Chief of Staff',
    avatar: 'K',
    color: '#616161',
    status: 'idle'
  },
  baxter_assistant: {
    id: 'baxter_assistant',
    name: 'Baxter',
    title: 'Executive Assistant',
    avatar: 'B',
    color: '#795548',
    status: 'idle'
  }
};

interface ACORNChatRoomMemoryEnhancedProps {
  roomId?: string;
  initialParticipants?: string[];
}

export const ACORNChatRoomMemoryEnhanced: React.FC<ACORNChatRoomMemoryEnhancedProps> = ({ roomId, initialParticipants = [] }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  // Store participants with their full IDs (including acorn/ prefix if present)
  const [participants, setParticipants] = useState<Set<string>>(new Set(initialParticipants));
  // System agents are now automatically included by default (ubiquitous AI paradigm)
  const [systemParticipants, setSystemParticipants] = useState<Set<string>>(
    new Set(Object.keys(SYSTEM_AGENTS))
  );
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentProfile>>({
    ...ACORN_EXECUTIVES,
    ...SYSTEM_AGENTS
  });
  const [infrastructureEvents, setInfrastructureEvents] = useState<InfrastructureEvent[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Memory Enhancement State
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [selectedMemoryItem, setSelectedMemoryItem] = useState<any>(null);
  const [memoryStatsVisible, setMemoryStatsVisible] = useState(true);
  
  // Phase 4 Advanced Features State
  const [constraintValidatorOpen, setConstraintValidatorOpen] = useState(false);
  const [collaborativeEditorOpen, setCollaborativeEditorOpen] = useState(false);
  const [taskPlannerOpen, setTaskPlannerOpen] = useState(false);
  const [performanceOverlayVisible, setPerformanceOverlayVisible] = useState(false);
  
  // System Agent Integration
  const systemAgentIntegration = useSystemAgentIntegration(roomId || 'default-room');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Claude Code task tracking
  const [activeTasks, setActiveTasks] = useState<Map<string, { agentId: string, startTime: Date }>>(new Map());
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // Clarification state
  const [selectedClarification, setSelectedClarification] = useState<ClarificationRequest | null>(null);
  const [clarificationDialogOpen, setClarificationDialogOpen] = useState(false);
  const [showClarificationAlert, setShowClarificationAlert] = useState(false);
  
  // Multi-modal state
  const [pendingMedia, setPendingMedia] = useState<AnyMediaItem[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [selectedMediaContext, setSelectedMediaContext] = useState<MultiModalContext | null>(null);
  
  // Capability discovery state
  const [capabilityBrowserOpen, setCapabilityBrowserOpen] = useState(false);
  const [taskFeasibilityOpen, setTaskFeasibilityOpen] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<CapabilitySpec | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Learning insights state
  const [showLearningInsights, setShowLearningInsights] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('ACORNChatRoomMemoryEnhanced mounted with:', {
      roomId,
      initialParticipants,
      participantsSet: Array.from(participants),
      systemParticipants: Array.from(systemParticipants),
      note: 'System agents (Thedra, Greta, Bradley, Digby) automatically included with memory enhancement'
    });
  }, [roomId, initialParticipants, participants, systemParticipants]);

  // Helper function to get tenant context for WebSocket URLs (DATA APIs - use selected tenant)
  const getTenantQueryParams = useCallback(() => {
    try {
      // First try: Get tenant context from project store (for superadmin user selections)
      const projectStoreData = localStorage.getItem('project-store');
      if (projectStoreData) {
        const store = JSON.parse(projectStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          console.log('🏢 WebSocket: Using selected tenant context for chat WebSocket:', {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          });
          return `?customer_id=${encodeURIComponent(state.currentCustomer.id)}&project_id=${encodeURIComponent(state.currentProject.id)}`;
        }
      }
      
      // Fallback: Use tenant-store for detected tenant (from subdomain)
      const tenantStoreData = localStorage.getItem('tenant-store');
      if (tenantStoreData) {
        const store = JSON.parse(tenantStoreData);
        const state = store.state || store;
        
        if (state.currentCustomer?.id && state.currentProject?.id) {
          console.log('🏢 WebSocket: Using detected tenant context for chat WebSocket:', {
            customerId: state.currentCustomer.id,
            projectId: state.currentProject.id
          });
          return `?customer_id=${encodeURIComponent(state.currentCustomer.id)}&project_id=${encodeURIComponent(state.currentProject.id)}`;
        }
      }
      
      // No fallback to superadmin for data APIs - require explicit tenant selection
      console.warn('🏢 WebSocket: No tenant context available for chat WebSocket - connections may fail');
      
    } catch (error) {
      console.warn('🏢 WebSocket: Failed to get tenant context for WebSocket URL:', error);
    }
    
    return '';
  }, []);

  // WebSocket for chat - only connect if we have a roomId
  const chatWs = useWebSocketSimple({
    url: roomId ? `${WS_BASE}/api/chat/ws/${roomId}${getTenantQueryParams()}` : '',
    enabled: !!roomId,
    onConnect: () => {
      setIsConnected(true);
      console.log('Connected to memory-enhanced chat room');
    },
    onDisconnect: () => {
      setIsConnected(false);
      console.log('Disconnected from memory-enhanced chat room');
    },
    onMessage: (message) => {
      // Enhance message with memory indicators (mock for demo)
      const enhancedMessage = {
        ...message,
        memory_enhanced: message.type === 'agent' && Math.random() > 0.3, // 70% chance of memory enhancement
        memory_context: message.type === 'agent' ? [
          {
            id: `ctx_${Date.now()}`,
            content: 'Previous conversation about similar topics',
            relevance_score: 0.85 + Math.random() * 0.15,
            memory_type: ['conversation', 'learning', 'insight'][Math.floor(Math.random() * 3)],
            source: message.agent_id || 'system',
            timestamp: new Date().toISOString()
          }
        ] : undefined,
        learning_applied: message.type === 'agent' ? [
          {
            pattern_applied: 'user_preference_concise_response',
            confidence: 0.92,
            learning_type: 'user_preference'
          }
        ] : undefined,
        cross_agent_insights: message.type === 'agent' && Math.random() > 0.5 ? [
          'Security best practices from Bradley',
          'Memory optimization from Thedra'
        ] : undefined
      };
      
      setMessages(prev => [...prev, enhancedMessage]);
      
      // Update agent status based on message
      if (message.type === 'agent' && message.agent_id) {
        const normalizedId = message.agent_id.replace('acorn/', '');
        setAgentStatuses(prev => ({
          ...prev,
          [normalizedId]: { ...prev[normalizedId], status: 'idle' }
        }));
      }
    }
  });

  // WebSocket for infrastructure events
  const infraWs = useWebSocketSimple({
    url: `${WS_BASE}/api/chat/infrastructure${getTenantQueryParams()}`,
    enabled: !!roomId,
    onMessage: (infraEvent) => {
      setInfrastructureEvents(prev => [...prev.slice(-50), infraEvent]); // Keep last 50 events
      
      // Update agent status based on infrastructure events
      if (infraEvent.agent_id) {
        const normalizedId = infraEvent.agent_id.replace('acorn/', '');
        if (infraEvent.type === 'agent_processing_started') {
          setAgentStatuses(prev => ({
            ...prev,
            [normalizedId]: { ...prev[normalizedId], status: 'thinking' }
          }));
        } else if (infraEvent.type === 'agent_processing_completed' || infraEvent.type === 'agent_processing_failed') {
          setAgentStatuses(prev => ({
            ...prev,
            [normalizedId]: { ...prev[normalizedId], status: 'idle' }
          }));
        }
        
        // Detect Claude Code task events
        if (infraEvent.type === 'claude_code_task_started' && infraEvent.task_id) {
          console.log('Claude Code task started:', infraEvent.task_id);
          setActiveTasks(prev => new Map(prev).set(infraEvent.task_id, { 
            agentId: normalizedId, 
            startTime: new Date() 
          }));
          setCurrentTaskId(infraEvent.task_id);
        } else if (infraEvent.type === 'claude_code_task_completed' && infraEvent.task_id) {
          console.log('Claude Code task completed:', infraEvent.task_id);
          setActiveTasks(prev => {
            const newMap = new Map(prev);
            newMap.delete(infraEvent.task_id);
            return newMap;
          });
          if (currentTaskId === infraEvent.task_id) {
            setCurrentTaskId(null);
          }
        }
      }
    }
  });
  
  // Claude progress tracking
  const { currentProgress, error: progressError } = useClaudeProgress({
    taskId: currentTaskId || '',
    enabled: !!currentTaskId,
    onComplete: () => {
      console.log('Claude task completed');
      setCurrentTaskId(null);
    },
    onError: (error) => {
      console.error('Claude task error:', error);
    }
  });
  
  // Clarification management
  const { 
    pending: pendingClarifications,
    respondToClarification,
    skipClarification,
    addMockClarification // For testing
  } = useClarificationManager({
    taskId: currentTaskId || undefined,
    enabled: !!currentTaskId,
    onNewClarification: (request) => {
      console.log('New clarification request:', request);
      setShowClarificationAlert(true);
      // Auto-open if high urgency
      if (request.urgency === 'CRITICAL' || request.urgency === 'HIGH') {
        setSelectedClarification(request);
        setClarificationDialogOpen(true);
      }
    },
    onClarificationExpired: (requestId) => {
      console.log('Clarification expired:', requestId);
    }
  });

  // Capability management
  const {
    capabilities,
    loading: capabilitiesLoading,
    error: capabilitiesError,
    validateTask,
    getCapabilityHints
  } = useCapabilityManager({
    enabled: !!roomId
  });

  // Learning insights
  const { dashboardData: learningData } = useLearningInsights({
    enabled: !!roomId
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Tool Control Event Listeners (same as before)
  useEffect(() => {
    const handleSwitchToTab = (event: CustomEvent) => {
      const { tabIndex, toolParams } = event.detail;
      setSelectedTab(tabIndex);
      
      // Update system agent integration state
      if (toolParams) {
        systemAgentIntegration.sendToolEvent({
          id: `event-${Date.now()}`,
          tool_type: tabIndex === 2 ? 'constraint_validator' : 
                     tabIndex === 3 ? 'collaborative_editor' :
                     tabIndex === 4 ? 'task_planner' : 'unknown',
          event_type: 'user_interaction',
          data: { interaction_type: 'tab_switched', tab_index: tabIndex, params: toolParams },
          timestamp: new Date().toISOString(),
          room_id: roomId
        });
      }
    };

    const handleTogglePerformanceOverlay = (event: CustomEvent) => {
      const { visible, ...config } = event.detail;
      setPerformanceOverlayVisible(visible);
      
      systemAgentIntegration.sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'performance_overlay',
        event_type: visible ? 'tool_opened' : 'tool_closed',
        data: config,
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    };

    window.addEventListener('switchToTab', handleSwitchToTab as EventListener);
    window.addEventListener('togglePerformanceOverlay', handleTogglePerformanceOverlay as EventListener);

    return () => {
      window.removeEventListener('switchToTab', handleSwitchToTab as EventListener);
      window.removeEventListener('togglePerformanceOverlay', handleTogglePerformanceOverlay as EventListener);
    };
  }, [systemAgentIntegration, roomId]);

  // Enhanced Chat Commands (same as before but with memory commands)
  const handleEnhancedCommands = useCallback((message: string) => {
    const trimmed = message.trim();
    
    // Memory commands
    if (trimmed === '/memory') {
      setMemoryPanelOpen(true);
      return true;
    }
    
    if (trimmed === '/memory-stats') {
      setMemoryStatsVisible(!memoryStatsVisible);
      return true;
    }
    
    if (trimmed.startsWith('/remember ')) {
      const memoryContent = trimmed.substring('/remember '.length);
      // Mock storing memory
      const mockMessage: Message = {
        type: 'system',
        content: `📝 Stored in memory: "${memoryContent}"`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, mockMessage]);
      return true;
    }
    
    // Tool control commands (same as before)
    if (trimmed.startsWith('/create-task ')) {
      const taskDescription = trimmed.substring('/create-task '.length);
      const event = new CustomEvent('createTask', {
        detail: {
          title: taskDescription,
          type: 'task',
          priority: 'medium',
          description: `Task created via chat: ${taskDescription}`
        }
      });
      window.dispatchEvent(event);
      setSelectedTab(4); // Switch to task planner
      return true;
    }
    
    if (trimmed.startsWith('/validate-security')) {
      const scope = trimmed.substring('/validate-security'.length).trim() || 'all';
      const event = new CustomEvent('validateConstraints', {
        detail: { scope }
      });
      window.dispatchEvent(event);
      setSelectedTab(2); // Switch to constraints
      return true;
    }
    
    if (trimmed.startsWith('/open-code ')) {
      const pattern = trimmed.substring('/open-code '.length);
      const event = new CustomEvent('openFilesByPattern', {
        detail: { pattern }
      });
      window.dispatchEvent(event);
      setSelectedTab(3); // Switch to code editor
      return true;
    }
    
    if (trimmed.startsWith('/monitor ')) {
      const metrics = trimmed.substring('/monitor '.length);
      const event = new CustomEvent('focusOnMetric', {
        detail: { metric: metrics }
      });
      window.dispatchEvent(event);
      setPerformanceOverlayVisible(true);
      return true;
    }
    
    return false;
  }, [memoryStatsVisible]);
  
  const sendMessage = useCallback(() => {
    if ((inputMessage.trim() || pendingMedia.length > 0) && chatWs.isConnected) {
      // Check for enhanced commands first
      if (handleEnhancedCommands(inputMessage)) {
        setInputMessage('');
        return;
      }
      const allParticipants = [...Array.from(participants), ...Array.from(systemParticipants)];
      console.log('Sending message:', inputMessage);
      console.log('All participants:', allParticipants);
      console.log('Pending media:', pendingMedia.length);
      
      // Check for test commands
      if (inputMessage === '/test-clarification') {
        addMockClarification();
        setInputMessage('');
        return;
      }
      
      // Check for capability commands
      if (inputMessage.startsWith('/feasibility ')) {
        const taskDescription = inputMessage.substring(13).trim();
        if (taskDescription) {
          const request: TaskFeasibilityRequest = {
            description: taskDescription,
            complexity: 'MODERATE' as any
          };
          validateTask(request).then(result => {
            const resultMessage: Message = {
              type: 'system',
              content: `Task Feasibility: ${result.feasible ? '✅ Feasible' : '❌ Not Feasible'}\n` +
                      `Confidence: ${result.confidence}\n` +
                      `Estimated Duration: ${result.estimatedDuration}\n` +
                      `Reasoning: ${result.reasoning}`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, resultMessage]);
          }).catch(err => {
            console.error('Feasibility check failed:', err);
          });
        }
        setInputMessage('');
        return;
      }
      
      if (inputMessage === '/capabilities') {
        setCapabilityBrowserOpen(true);
        setInputMessage('');
        return;
      }
      
      if (inputMessage === '/insights') {
        if (learningData && learningData.insights.length > 0) {
          const insight = learningData.insights[0];
          const insightMessage: Message = {
            type: 'system',
            content: `📊 **Learning Insight**: ${insight.title}\n\n` +
                    `${insight.description}\n\n` +
                    `**Pattern**: ${insight.pattern}\n` +
                    `**Impact**: ${insight.impact}\n` +
                    `**Confidence**: ${Math.round(insight.confidence * 100)}%`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, insightMessage]);
        } else {
          const noInsightMessage: Message = {
            type: 'system',
            content: '📊 No learning insights available yet. Keep collaborating to generate insights!',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, noInsightMessage]);
        }
        setInputMessage('');
        return;
      }
      
      chatWs.send({
        type: 'user',
        content: inputMessage,
        user_id: 'user',
        target_agents: allParticipants.length > 0 ? allParticipants : undefined,
        media_items: pendingMedia.length > 0 ? pendingMedia : undefined
      });
      setInputMessage('');
      setPendingMedia([]);
      setShowMediaUpload(false);
    } else {
      console.log('Cannot send - trim:', inputMessage.trim(), 'connected:', chatWs.isConnected);
    }
  }, [inputMessage, pendingMedia, chatWs, participants, systemParticipants, addMockClarification, validateTask, handleEnhancedCommands, learningData]);
  
  // Handle media addition
  const handleMediaAdded = useCallback((mediaItems: AnyMediaItem[]) => {
    setPendingMedia(prev => [...prev, ...mediaItems]);
  }, []);
  
  // Handle media removal
  const handleMediaRemoved = useCallback((mediaId: string) => {
    setPendingMedia(prev => prev.filter(item => item.id !== mediaId));
  }, []);
  
  // Handle clarification response
  const handleClarificationResponse = useCallback(async (optionId: string, reasoning?: string) => {
    if (!selectedClarification) return;
    
    try {
      await respondToClarification(
        selectedClarification.id,
        optionId,
        reasoning
      );
      setClarificationDialogOpen(false);
      setSelectedClarification(null);
    } catch (error) {
      console.error('Failed to respond to clarification:', error);
    }
  }, [selectedClarification, respondToClarification]);

  // Handle capability selection
  const handleCapabilitySelect = useCallback((capability: CapabilitySpec) => {
    setSelectedCapability(capability);
    setCapabilityBrowserOpen(false);
    
    // Show capability info in chat
    const capabilityMessage: Message = {
      type: 'system',
      content: `🔍 **${capability.name}**\n` +
              `${capability.description}\n\n` +
              `**Confidence:** ${capability.confidence}\n` +
              `**Complexity:** ${capability.complexity}\n` +
              `**Examples:**\n${capability.examples.map(ex => `• ${ex}`).join('\n')}`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, capabilityMessage]);
  }, []);

  // Handle capability hint selection
  const handleCapabilityHintSelect = useCallback((hint: CapabilityHint) => {
    const capability = capabilities.find(c => c.id === hint.capability);
    if (capability) {
      handleCapabilitySelect(capability);
    }
  }, [capabilities, handleCapabilitySelect]);

  const addParticipant = useCallback((agentId: string) => {
    setParticipants(prev => new Set(prev).add(agentId));
    if (chatWs.isConnected) {
      chatWs.send({
        type: 'add_participant',
        agent_id: agentId
      });
    }
  }, [chatWs]);

  const removeParticipant = useCallback((agentId: string) => {
    setParticipants(prev => {
      const newSet = new Set(prev);
      newSet.delete(agentId);
      return newSet;
    });
    if (chatWs.isConnected) {
      chatWs.send({
        type: 'remove_participant',
        agent_id: agentId
      });
    }
  }, [chatWs]);

  const addSystemParticipant = useCallback((agentId: string) => {
    setSystemParticipants(prev => new Set(prev).add(agentId));
    if (chatWs.isConnected) {
      chatWs.send({
        type: 'add_participant',
        agent_id: agentId
      });
    }
  }, [chatWs]);

  const removeSystemParticipant = useCallback((agentId: string) => {
    setSystemParticipants(prev => {
      const newSet = new Set(prev);
      newSet.delete(agentId);
      return newSet;
    });
    if (chatWs.isConnected) {
      chatWs.send({
        type: 'remove_participant',
        agent_id: agentId
      });
    }
  }, [chatWs]);

  const renderMessage = (message: Message, index: number) => {
    // Handle both formats: with and without acorn/ prefix
    const normalizedAgentId = message.agent_id ? message.agent_id.replace('acorn/', '') : null;
    const agent = normalizedAgentId ? (agentStatuses[normalizedAgentId] || agentStatuses[message.agent_id!]) : null;

    return (
      <MemoryEnhancedMessage
        key={index}
        message={message}
        agent={agent || undefined}
        index={index}
        onMemoryContextClick={(context) => {
          console.log('Memory context clicked:', context);
          setSelectedMemoryItem(context);
        }}
      />
    );
  };

  const renderInfrastructureEvent = (event: InfrastructureEvent, index: number) => {
    // Handle both formats: with and without acorn/ prefix
    const normalizedAgentId = event.agent_id ? event.agent_id.replace('acorn/', '') : null;
    const agent = normalizedAgentId ? (agentStatuses[normalizedAgentId] || agentStatuses[event.agent_id!]) : null;
    let icon = <PsychologyIcon />;
    let color = 'default';

    if (event.type.includes('memory')) {
      icon = <MemoryIcon />;
      color = 'primary';
    } else if (event.type.includes('code') || event.type.includes('claude')) {
      icon = <CodeIcon />;
      color = 'secondary';
    }

    return (
      <ListItem key={index} dense>
        <ListItemAvatar>
          <Avatar sx={{ width: 30, height: 30, bgcolor: `${color}.light` }}>
            {icon}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="caption">
              {agent ? `${agent.name}: ` : ''}{event.type}
            </Typography>
          }
          secondary={
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              {new Date(event.timestamp).toLocaleTimeString()}
            </Typography>
          }
        />
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100vh', p: 2 }}>
      {/* Agent Selection Panel with Memory Enhancement */}
      <Box sx={{ width: '25%' }}>
        <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              ACORN Executives
            </Typography>
            <IconButton
              size="small"
              onClick={() => setMemoryPanelOpen(true)}
              color="primary"
              title="View conversation memory"
            >
              <MemoryPanelIcon />
            </IconButton>
          </Box>
          <List>
            {Object.values(ACORN_EXECUTIVES).map((agent) => {
              const agentClarifications = pendingClarifications.filter(c => c.agent_id === agent.id);
              const urgentClarification = agentClarifications.find(c => 
                c.urgency === 'CRITICAL' || c.urgency === 'HIGH'
              );
              
              return (
              <ListItem key={agent.id}>
                <ListItemAvatar>
                  <ClarificationNotification
                    count={agentClarifications.length}
                    urgency={urgentClarification?.urgency}
                    agentAvatar={<Avatar sx={{ bgcolor: agent.color }}>{agent.avatar}</Avatar>}
                    onClick={() => {
                      if (agentClarifications.length > 0) {
                        setSelectedClarification(agentClarifications[0]);
                        setClarificationDialogOpen(true);
                      }
                    }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={agent.name}
                  secondary={
                    <Box>
                      <Typography variant="caption">{agent.title}</Typography>
                      {agent.status !== 'idle' && (
                        <Chip
                          label={agent.status}
                          size="small"
                          color={agent.status === 'thinking' ? 'warning' : 'success'}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <IconButton
                  size="small"
                  onClick={() =>
                    participants.has(agent.id)
                      ? removeParticipant(agent.id)
                      : addParticipant(agent.id)
                  }
                  color={participants.has(agent.id) ? 'primary' : 'default'}
                >
                  {participants.has(agent.id) ? <CloseIcon /> : <AddIcon />}
                </IconButton>
              </ListItem>
              );
            })}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            System Agents
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            🧠 Memory-Enhanced AI Assistants
          </Typography>
          <List>
            {Object.values(SYSTEM_AGENTS).map((agent) => {
              const agentClarifications = pendingClarifications.filter(c => c.agent_id === agent.id);
              const urgentClarification = agentClarifications.find(c => 
                c.urgency === 'CRITICAL' || c.urgency === 'HIGH'
              );
              
              return (
              <ListItem key={agent.id}>
                <ListItemAvatar>
                  <ClarificationNotification
                    count={agentClarifications.length}
                    urgency={urgentClarification?.urgency}
                    agentAvatar={<Avatar sx={{ bgcolor: agent.color }}>{agent.avatar}</Avatar>}
                    onClick={() => {
                      if (agentClarifications.length > 0) {
                        setSelectedClarification(agentClarifications[0]);
                        setClarificationDialogOpen(true);
                      }
                    }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">{agent.name}</Typography>
                      {memoryStatsVisible && agent.memory_stats && (
                        <MemoryStatusIndicator
                          agentId={agent.id}
                          roomId={roomId || 'default'}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption">{agent.title}</Typography>
                      {agent.status !== 'idle' && (
                        <Chip
                          label={agent.status}
                          size="small"
                          color={agent.status === 'thinking' ? 'warning' : 'success'}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                />
                <IconButton
                  size="small"
                  onClick={() =>
                    systemParticipants.has(agent.id)
                      ? removeSystemParticipant(agent.id)
                      : addSystemParticipant(agent.id)
                  }
                  color={systemParticipants.has(agent.id) ? 'primary' : 'default'}
                >
                  {systemParticipants.has(agent.id) ? <CloseIcon /> : <AddIcon />}
                </IconButton>
              </ListItem>
              );
            })}
          </List>
        </Paper>
      </Box>

      {/* Chat and Infrastructure Panel */}
      <Box sx={{ flex: 1 }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} variant="scrollable" scrollButtons="auto">
              <Tab label="Chat" />
              <Tab label="Infrastructure Events" />
              <Tab label="Constraints" icon={<SecurityIcon />} />
              <Tab label="Code Editor" icon={<EditIcon />} />
              <Tab label="Task Planner" icon={<TaskIcon />} />
            </Tabs>
          </Box>

          {/* Chat Messages */}
          {selectedTab === 0 && (
            <>
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message, index) => renderMessage(message, index))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                {/* Claude Progress Bar */}
                {currentTaskId && currentProgress && (
                  <ClaudeProgressBar
                    taskId={currentTaskId}
                    currentStage={currentProgress.summary.current_stage}
                    progress={currentProgress.event.progress}
                    message={currentProgress.event.message}
                    estimatedTimeRemaining={currentProgress.summary.estimated_remaining}
                    isComplete={currentProgress.summary.overall_progress >= 1.0}
                    error={progressError || undefined}
                    onClose={() => setCurrentTaskId(null)}
                  />
                )}
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  {Array.from(participants).map((agentId) => {
                    // Handle both formats: with and without acorn/ prefix
                    const normalizedId = agentId.replace('acorn/', '');
                    const agent = agentStatuses[normalizedId] || agentStatuses[agentId];
                    if (!agent) {
                      console.warn(`Agent not found for ID: ${agentId}`);
                      return null;
                    }
                    return (
                      <Chip
                        key={agentId}
                        avatar={<Avatar sx={{ bgcolor: agent.color }}>{agent.avatar}</Avatar>}
                        label={agent.name}
                        onDelete={() => removeParticipant(agentId)}
                        size="small"
                      />
                    );
                  })}
                  {Array.from(systemParticipants).map((agentId) => {
                    const agent = SYSTEM_AGENTS[agentId];
                    if (!agent) {
                      console.warn(`System agent not found for ID: ${agentId}`);
                      return null;
                    }
                    return (
                      <Chip
                        key={agentId}
                        avatar={<Avatar sx={{ bgcolor: agent.color }}>{agent.avatar}</Avatar>}
                        label={agent.name}
                        onDelete={() => removeSystemParticipant(agentId)}
                        size="small"
                        variant="outlined"
                      />
                    );
                  })}
                  {participants.size === 0 && systemParticipants.size === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Select agents to chat with
                    </Typography>
                  )}
                </Box>
                
                {/* Media Upload */}
                {showMediaUpload && (
                  <Box sx={{ mb: 2 }}>
                    <MediaUpload
                      onMediaAdded={handleMediaAdded}
                      multiple
                    />
                  </Box>
                )}
                
                {/* Task Feasibility Checker */}
                {taskFeasibilityOpen && (
                  <Box sx={{ mb: 2 }}>
                    <TaskFeasibilityChecker
                      onValidateTask={validateTask}
                    />
                  </Box>
                )}
                
                {/* Pending Media Preview */}
                {pendingMedia.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Attachments ({pendingMedia.length}):
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      {pendingMedia.map((item) => (
                        <Chip
                          key={item.id}
                          label={item.title || `${item.type.toLowerCase()}`}
                          onDelete={() => handleMediaRemoved(item.id)}
                          size="small"
                          color="primary"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
                  <IconButton
                    onClick={() => setShowMediaUpload(!showMediaUpload)}
                    color={showMediaUpload ? 'primary' : 'default'}
                    title="Add media"
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setCapabilityBrowserOpen(true)}
                    color={capabilityBrowserOpen ? 'primary' : 'default'}
                    title="Browse capabilities"
                  >
                    <SearchIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setTaskFeasibilityOpen(!taskFeasibilityOpen)}
                    color={taskFeasibilityOpen ? 'primary' : 'default'}
                    title="Check task feasibility"
                  >
                    <AssessmentIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setPerformanceOverlayVisible(!performanceOverlayVisible)}
                    color={performanceOverlayVisible ? 'primary' : 'default'}
                    title="Toggle performance overlay"
                  >
                    <SpeedIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your message... (try /memory, /remember [text], /capabilities, /create-task [description], /validate-security, /open-code [pattern], /monitor [metric])"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!isConnected || (participants.size === 0 && systemParticipants.size === 0)}
                    inputRef={inputRef as any}
                  />
                  
                  {/* Capability Hints */}
                  <CapabilityHints
                    hints={getCapabilityHints(inputMessage)}
                    inputValue={inputMessage}
                    inputRef={inputRef as any}
                    onHintSelect={handleCapabilityHintSelect}
                    maxHints={3}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={sendMessage}
                    disabled={!isConnected || (participants.size === 0 && systemParticipants.size === 0) || (!inputMessage.trim() && pendingMedia.length === 0)}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </>
          )}

          {/* Infrastructure Events */}
          {selectedTab === 1 && (
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {infrastructureEvents.map((event, index) => renderInfrastructureEvent(event, index))}
            </List>
          )}
          
          {/* Constraint Validator */}
          {selectedTab === 2 && (
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <ConstraintValidator
                projectId="geneva-frontend"
                onConstraintUpdate={(constraint) => {
                  console.log('Constraint updated:', constraint);
                }}
                onViolationResolve={(violationId, note) => {
                  console.log('Violation resolved:', violationId, note);
                }}
                onValidationRun={(constraintIds) => {
                  console.log('Validation run for constraints:', constraintIds);
                }}
                realTimeValidation={true}
              />
            </Box>
          )}
          
          {/* Collaborative Editor */}
          {selectedTab === 3 && (
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <CollaborativeEditor
                sessionId="acorn-chat-session"
                onFileChange={(fileId, content) => {
                  console.log('File changed:', fileId, content);
                }}
                onFileSave={(fileId, content) => {
                  console.log('File saved:', fileId, content);
                }}
                onCollaboratorJoin={(collaborator) => {
                  console.log('Collaborator joined:', collaborator);
                }}
                onCursorMove={(fileId, cursor) => {
                  console.log('Cursor moved:', fileId, cursor);
                }}
                onSelectionChange={(fileId, selection) => {
                  console.log('Selection changed:', fileId, selection);
                }}
                showCollaborators={true}
                height={600}
              />
            </Box>
          )}
          
          {/* Task Planner */}
          {selectedTab === 4 && (
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <TaskPlanner
                planId="geneva-frontend-plan"
                onPlanUpdate={(plan) => {
                  console.log('Plan updated:', plan);
                }}
                onNodeUpdate={(nodeId, updates) => {
                  console.log('Node updated:', nodeId, updates);
                }}
                onConnectionUpdate={(connectionId, updates) => {
                  console.log('Connection updated:', connectionId, updates);
                }}
                showTimeline={true}
                enableCollaboration={true}
                height={600}
              />
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Memory Panel Drawer */}
      <Drawer
        anchor="right"
        open={memoryPanelOpen}
        onClose={() => setMemoryPanelOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            p: 2
          }
        }}
      >
        <ConversationMemoryPanel
          roomId={roomId || 'default'}
          activeAgents={[...Array.from(participants), ...Array.from(systemParticipants)]}
          onMemoryItemSelect={(item) => {
            console.log('Memory item selected:', item);
            setSelectedMemoryItem(item);
          }}
        />
      </Drawer>
      
      {/* Clarification Dialog */}
      <ClarificationDialog
        request={selectedClarification}
        open={clarificationDialogOpen}
        onClose={() => {
          setClarificationDialogOpen(false);
          setSelectedClarification(null);
        }}
        onRespond={handleClarificationResponse}
      />
      
      {/* Clarification Alert */}
      <Snackbar
        open={showClarificationAlert && pendingClarifications.length > 0}
        autoHideDuration={6000}
        onClose={() => setShowClarificationAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowClarificationAlert(false)}
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (pendingClarifications.length > 0) {
                  setSelectedClarification(pendingClarifications[0]);
                  setClarificationDialogOpen(true);
                }
                setShowClarificationAlert(false);
              }}
            >
              View
            </Button>
          }
        >
          Claude needs your input ({pendingClarifications.length} clarification{pendingClarifications.length !== 1 ? 's' : ''} pending)
        </Alert>
      </Snackbar>
      
      {/* Capability Browser */}
      <CapabilityBrowser
        open={capabilityBrowserOpen}
        onClose={() => setCapabilityBrowserOpen(false)}
        capabilities={capabilities}
        onCapabilitySelect={handleCapabilitySelect}
      />
      
      {/* Performance Overlay */}
      {performanceOverlayVisible && (
        <PerformanceOverlay
          position="top-right"
          updateInterval={2000}
          showAlerts={true}
          onMetricsUpdate={(metrics) => {
            console.log('Performance metrics updated:', metrics);
          }}
          thresholds={{
            cpu: 80,
            memory: 85,
            responseTime: 1000,
            errorRate: 5
          }}
        />
      )}
    </Box>
  );
};

export default ACORNChatRoomMemoryEnhanced;