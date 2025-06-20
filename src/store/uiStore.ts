import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Notification } from './types';

interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  sidebarWidth: number;
  
  // Navigation
  activeModule: 'observability' | 'acorn';
  breadcrumbs: Array<{ label: string; path: string }>;
  
  // Layout preferences
  splitViewRatio: number; // For execution split view
  timelineCollapsed: boolean;
  
  // Notifications
  notifications: Notification[];
  maxNotifications: number;
  
  // Modal and dialog states
  modals: {
    executionDetails: { open: boolean; executionId?: string };
    agentDetails: { open: boolean; agentId?: string };
    settings: { open: boolean };
    about: { open: boolean };
  };
  
  // Loading and connection states
  globalLoading: boolean;
  websocketStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastHeartbeat: string | null;
  
  // User preferences (persisted)
  preferences: {
    autoRefreshInterval: number; // in seconds
    enableNotifications: boolean;
    enableSounds: boolean;
    defaultTimeRange: '1h' | '6h' | '24h' | '7d';
    messagePageSize: number;
  };
}

interface UIActions {
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  
  // Navigation actions
  setActiveModule: (module: 'observability' | 'acorn') => void;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; path: string }>) => void;
  
  // Layout actions
  setSplitViewRatio: (ratio: number) => void;
  toggleTimeline: () => void;
  setTimelineCollapsed: (collapsed: boolean) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Modal actions
  openModal: (modal: keyof UIState['modals'], data?: any) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  
  // Connection actions
  setGlobalLoading: (loading: boolean) => void;
  setWebSocketStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  updateHeartbeat: () => void;
  
  // Preferences actions
  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;
  resetPreferences: () => void;
}

type UIStore = UIState & UIActions;

const defaultPreferences: UIState['preferences'] = {
  autoRefreshInterval: 30,
  enableNotifications: true,
  enableSounds: false,
  defaultTimeRange: '24h',
  messagePageSize: 50
};

const initialState: UIState = {
  theme: 'system',
  sidebarOpen: true,
  sidebarWidth: 280,
  activeModule: 'observability',
  breadcrumbs: [],
  splitViewRatio: 0.35,
  timelineCollapsed: false,
  notifications: [],
  maxNotifications: 5,
  modals: {
    executionDetails: { open: false },
    agentDetails: { open: false },
    settings: { open: false },
    about: { open: false }
  },
  globalLoading: false,
  websocketStatus: 'disconnected',
  lastHeartbeat: null,
  preferences: defaultPreferences
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Theme actions
        setTheme: (theme) => {
          set({ theme });
        },
        
        toggleSidebar: () => {
          set((state) => ({ sidebarOpen: !state.sidebarOpen }));
        },
        
        setSidebarWidth: (width) => {
          set({ sidebarWidth: Math.max(200, Math.min(400, width)) });
        },
        
        // Navigation actions
        setActiveModule: (module) => {
          set({ activeModule: module });
        },
        
        setBreadcrumbs: (breadcrumbs) => {
          set({ breadcrumbs });
        },
        
        // Layout actions
        setSplitViewRatio: (ratio) => {
          set({ splitViewRatio: Math.max(0.2, Math.min(0.8, ratio)) });
        },
        
        toggleTimeline: () => {
          set((state) => ({ timelineCollapsed: !state.timelineCollapsed }));
        },
        
        setTimelineCollapsed: (collapsed) => {
          set({ timelineCollapsed: collapsed });
        },
        
        // Notification actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            autoHide: notification.autoHide ?? true,
            duration: notification.duration ?? 5000
          };
          
          set((state) => {
            const newNotifications = [newNotification, ...state.notifications];
            
            // Limit number of notifications
            if (newNotifications.length > state.maxNotifications) {
              newNotifications.splice(state.maxNotifications);
            }
            
            return { notifications: newNotifications };
          });
          
          // Auto-remove notification if specified
          if (newNotification.autoHide) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, newNotification.duration);
          }
        },
        
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },
        
        clearNotifications: () => {
          set({ notifications: [] });
        },
        
        // Modal actions
        openModal: (modal, data) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: { open: true, ...data }
            }
          }));
        },
        
        closeModal: (modal) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: { open: false }
            }
          }));
        },
        
        closeAllModals: () => {
          set((state) => {
            const closedModals = Object.keys(state.modals).reduce((acc, key) => {
              acc[key as keyof UIState['modals']] = { open: false };
              return acc;
            }, {} as UIState['modals']);
            
            return { modals: closedModals };
          });
        },
        
        // Connection actions
        setGlobalLoading: (loading) => {
          set({ globalLoading: loading });
        },
        
        setWebSocketStatus: (status) => {
          set({ websocketStatus: status });
          
          // Update heartbeat when connected
          if (status === 'connected') {
            get().updateHeartbeat();
          }
        },
        
        updateHeartbeat: () => {
          set({ lastHeartbeat: new Date().toISOString() });
        },
        
        // Preferences actions
        updatePreferences: (newPreferences) => {
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences }
          }));
        },
        
        resetPreferences: () => {
          set({ preferences: defaultPreferences });
        }
      }),
      {
        name: 'geneva-ui-store',
        // Only persist user preferences and layout settings
        partialize: (state) => ({
          theme: state.theme,
          sidebarWidth: state.sidebarWidth,
          splitViewRatio: state.splitViewRatio,
          preferences: state.preferences
        })
      }
    ),
    { name: 'ui-store' }
  )
);