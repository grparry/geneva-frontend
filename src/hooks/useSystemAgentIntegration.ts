import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketSimple } from './useWebSocketSimple';

// Tool Integration Types
export interface ToolCommand {
  tool_action: string;
  parameters: Record<string, any>;
  timestamp: string;
}

export interface ToolEvent {
  id: string;
  tool_type: string;
  event_type: string;
  data: Record<string, any>;
  timestamp: string;
  user_id?: string;
  room_id?: string;
}

export interface AgentToolState {
  constraintValidator: {
    isOpen: boolean;
    activeProject?: string;
    currentConstraints?: any[];
    lastValidation?: string;
  };
  collaborativeEditor: {
    isOpen: boolean;
    activeSession?: string;
    openFiles?: any[];
    lastFileChange?: string;
  };
  taskPlanner: {
    isOpen: boolean;
    activePlan?: string;
    currentTasks?: any[];
    lastTaskUpdate?: string;
  };
  performanceOverlay: {
    isVisible: boolean;
    position?: string;
    focusMetrics?: string[];
    lastMetricsUpdate?: string;
  };
}

export interface SystemAgentIntegrationState {
  isConnected: boolean;
  toolStates: AgentToolState;
  pendingCommands: ToolCommand[];
  lastToolEvent?: ToolEvent;
  error?: string;
}

export const useSystemAgentIntegration = (roomId: string) => {
  const [state, setState] = useState<SystemAgentIntegrationState>({
    isConnected: false,
    toolStates: {
      constraintValidator: { isOpen: false },
      collaborativeEditor: { isOpen: false },
      taskPlanner: { isOpen: false },
      performanceOverlay: { isVisible: false }
    },
    pendingCommands: []
  });

  const [toolCommandHandlers, setToolCommandHandlers] = useState<Record<string, (command: ToolCommand) => void>>({});
  const commandQueueRef = useRef<ToolCommand[]>([]);

  // WebSocket connection for tool commands
  const { 
    isConnected, 
    sendMessage, 
    lastMessage, 
    error: wsError 
  } = useWebSocketSimple(`/api/chat/ws/${roomId}`);

  // Process incoming WebSocket messages for tool commands
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'tool_command') {
      const toolCommand: ToolCommand = lastMessage.data;
      handleIncomingToolCommand(toolCommand);
    }
  }, [lastMessage]);

  // Update connection state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected,
      error: wsError || undefined
    }));
  }, [isConnected, wsError]);

  const handleIncomingToolCommand = useCallback((command: ToolCommand) => {
    console.log('🛠️ Received tool command:', command);

    // Add to pending commands
    setState(prev => ({
      ...prev,
      pendingCommands: [...prev.pendingCommands, command]
    }));

    // Route to appropriate handler
    const handler = toolCommandHandlers[command.tool_action];
    if (handler) {
      try {
        handler(command);
        // Remove from pending commands after successful handling
        setState(prev => ({
          ...prev,
          pendingCommands: prev.pendingCommands.filter(cmd => cmd !== command)
        }));
      } catch (error) {
        console.error('Error handling tool command:', error);
        setState(prev => ({
          ...prev,
          error: `Failed to handle tool command: ${command.tool_action}`
        }));
      }
    } else {
      console.warn('No handler registered for tool action:', command.tool_action);
    }
  }, [toolCommandHandlers]);

  // Register tool command handlers
  const registerToolHandler = useCallback((action: string, handler: (command: ToolCommand) => void) => {
    setToolCommandHandlers(prev => ({
      ...prev,
      [action]: handler
    }));
  }, []);

  const unregisterToolHandler = useCallback((action: string) => {
    setToolCommandHandlers(prev => {
      const newHandlers = { ...prev };
      delete newHandlers[action];
      return newHandlers;
    });
  }, []);

  // Send tool events back to agents
  const sendToolEvent = useCallback((toolEvent: ToolEvent) => {
    if (isConnected) {
      const message = {
        type: 'tool_event',
        data: toolEvent
      };
      sendMessage(message);
      
      setState(prev => ({
        ...prev,
        lastToolEvent: toolEvent
      }));
      
      console.log('📡 Sent tool event:', toolEvent);
    }
  }, [isConnected, sendMessage]);

  // Update tool state
  const updateToolState = useCallback((toolType: keyof AgentToolState, updates: Partial<AgentToolState[keyof AgentToolState]>) => {
    setState(prev => ({
      ...prev,
      toolStates: {
        ...prev.toolStates,
        [toolType]: {
          ...prev.toolStates[toolType],
          ...updates
        }
      }
    }));
  }, []);

  // Pre-built handlers for common tool actions
  const toolActionHandlers = {
    // Constraint Validator handlers
    open_constraint_validator: (command: ToolCommand) => {
      const { project_id, focus_area, auto_validate } = command.parameters;
      
      updateToolState('constraintValidator', {
        isOpen: true,
        activeProject: project_id,
        lastValidation: new Date().toISOString()
      });

      // Trigger tab switch to constraints
      const event = new CustomEvent('switchToTab', { 
        detail: { tabIndex: 2, toolParams: command.parameters } 
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'constraint_validator',
        event_type: 'tool_opened',
        data: { project_id, focus_area },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    validate_constraints: (command: ToolCommand) => {
      const { constraint_ids, scope } = command.parameters;

      // Trigger validation in ConstraintValidator component
      const event = new CustomEvent('validateConstraints', {
        detail: { constraintIds: constraint_ids, scope }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'constraint_validator', 
        event_type: 'operation_completed',
        data: { operation: 'validate_constraints', constraint_ids, scope },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    create_constraint: (command: ToolCommand) => {
      const { constraint_type, name, description, rule } = command.parameters;

      const event = new CustomEvent('createConstraint', {
        detail: { type: constraint_type, name, description, rule }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'constraint_validator',
        event_type: 'data_changed',
        data: { operation: 'constraint_created', name },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    // Collaborative Editor handlers
    open_collaborative_editor: (command: ToolCommand) => {
      const { session_id, files, focus_file, read_only } = command.parameters;

      updateToolState('collaborativeEditor', {
        isOpen: true,
        activeSession: session_id,
        openFiles: files
      });

      // Switch to code editor tab
      const event = new CustomEvent('switchToTab', {
        detail: { tabIndex: 3, toolParams: command.parameters }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'collaborative_editor',
        event_type: 'tool_opened',
        data: { session_id, files },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    create_file: (command: ToolCommand) => {
      const { file_name, content, language } = command.parameters;

      const event = new CustomEvent('createFile', {
        detail: { name: file_name, content, language }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'collaborative_editor',
        event_type: 'data_changed',
        data: { operation: 'file_created', file_name },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    open_files_by_pattern: (command: ToolCommand) => {
      const { pattern, file_types } = command.parameters;

      const event = new CustomEvent('openFilesByPattern', {
        detail: { pattern, fileTypes: file_types }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'collaborative_editor',
        event_type: 'operation_completed',
        data: { operation: 'files_opened_by_pattern', pattern },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    search_and_replace: (command: ToolCommand) => {
      const { search_term, replace_term, scope } = command.parameters;

      const event = new CustomEvent('searchAndReplace', {
        detail: { searchTerm: search_term, replaceTerm: replace_term, scope }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'collaborative_editor',
        event_type: 'operation_completed',
        data: { operation: 'search_and_replace', search_term, replace_term },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    // Task Planner handlers
    open_task_planner: (command: ToolCommand) => {
      const { plan_id, project_id, template } = command.parameters;

      updateToolState('taskPlanner', {
        isOpen: true,
        activePlan: plan_id
      });

      // Switch to task planner tab
      const event = new CustomEvent('switchToTab', {
        detail: { tabIndex: 4, toolParams: command.parameters }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'task_planner',
        event_type: 'tool_opened',
        data: { plan_id, project_id },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    create_task: (command: ToolCommand) => {
      const { title, description, type, priority, assigned_to, estimated_hours, dependencies, tags } = command.parameters;

      const event = new CustomEvent('createTask', {
        detail: {
          title,
          description,
          type: type || 'task',
          priority: priority || 'medium',
          assignedTo: assigned_to,
          estimatedHours: estimated_hours,
          dependencies: dependencies || [],
          tags: tags || []
        }
      });
      window.dispatchEvent(event);

      updateToolState('taskPlanner', {
        lastTaskUpdate: new Date().toISOString()
      });

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'task_planner',
        event_type: 'data_changed',
        data: { operation: 'task_created', title },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    create_workflow: (command: ToolCommand) => {
      const { workflow_type, tasks, dependencies } = command.parameters;

      const event = new CustomEvent('createWorkflow', {
        detail: { workflowType: workflow_type, tasks, dependencies }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'task_planner',
        event_type: 'operation_completed',
        data: { operation: 'workflow_created', workflow_type },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    update_task_status: (command: ToolCommand) => {
      const { task_id, status, notes } = command.parameters;

      const event = new CustomEvent('updateTaskStatus', {
        detail: { taskId: task_id, status, notes }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'task_planner',
        event_type: 'data_changed',
        data: { operation: 'task_status_updated', task_id, status },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    // Performance Overlay handlers
    open_performance_overlay: (command: ToolCommand) => {
      const { position, compact, focus_metrics, alert_thresholds } = command.parameters;

      updateToolState('performanceOverlay', {
        isVisible: true,
        position: position || 'top-right',
        focusMetrics: focus_metrics || []
      });

      const event = new CustomEvent('togglePerformanceOverlay', {
        detail: { 
          visible: true, 
          position, 
          compact, 
          focusMetrics: focus_metrics,
          alertThresholds: alert_thresholds 
        }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'performance_overlay',
        event_type: 'tool_opened',
        data: { position, focus_metrics },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    configure_performance_overlay: (command: ToolCommand) => {
      const { update_interval, show_alerts, auto_hide, thresholds } = command.parameters;

      const event = new CustomEvent('configurePerformanceOverlay', {
        detail: { 
          updateInterval: update_interval,
          showAlerts: show_alerts,
          autoHide: auto_hide,
          thresholds 
        }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'performance_overlay',
        event_type: 'operation_completed',
        data: { operation: 'overlay_configured' },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    focus_on_metric: (command: ToolCommand) => {
      const { metric, duration } = command.parameters;

      updateToolState('performanceOverlay', {
        focusMetrics: [metric],
        lastMetricsUpdate: new Date().toISOString()
      });

      const event = new CustomEvent('focusOnMetric', {
        detail: { metric, duration: duration || 30 }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'performance_overlay',
        event_type: 'operation_completed',
        data: { operation: 'metric_focused', metric },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    },

    export_metrics: (command: ToolCommand) => {
      const { format, time_range } = command.parameters;

      const event = new CustomEvent('exportMetrics', {
        detail: { format: format || 'json', timeRange: time_range || 'last_hour' }
      });
      window.dispatchEvent(event);

      sendToolEvent({
        id: `event-${Date.now()}`,
        tool_type: 'performance_overlay',
        event_type: 'operation_completed',
        data: { operation: 'metrics_exported', format },
        timestamp: new Date().toISOString(),
        room_id: roomId
      });
    }
  };

  // Auto-register built-in handlers
  useEffect(() => {
    Object.entries(toolActionHandlers).forEach(([action, handler]) => {
      registerToolHandler(action, handler);
    });

    return () => {
      Object.keys(toolActionHandlers).forEach(action => {
        unregisterToolHandler(action);
      });
    };
  }, [registerToolHandler, unregisterToolHandler]);

  // Process queued commands when handlers are ready
  useEffect(() => {
    while (commandQueueRef.current.length > 0) {
      const command = commandQueueRef.current.shift()!;
      handleIncomingToolCommand(command);
    }
  }, [toolCommandHandlers, handleIncomingToolCommand]);

  return {
    // State
    isConnected: state.isConnected,
    toolStates: state.toolStates,
    pendingCommands: state.pendingCommands,
    lastToolEvent: state.lastToolEvent,
    error: state.error,

    // Actions
    registerToolHandler,
    unregisterToolHandler,
    sendToolEvent,
    updateToolState,

    // Built-in handlers
    toolActionHandlers
  };
};