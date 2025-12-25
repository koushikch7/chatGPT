'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  AppState,
  AppAction,
  User,
  Project,
  Conversation,
  Message,
  AppError,
  UserPreferences,
  APIKeyConfig,
} from '@/types';
import { DEFAULT_USER_PREFERENCES, DEFAULT_CONVERSATION_SETTINGS } from '@/lib/constants';

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  currentProjectId: null,
  currentConversationId: null,
  projects: [],
  conversations: [],
  apiKeys: {},
  isLoading: true,
  error: null,
  sidebarOpen: true,
  settingsOpen: false,
  theme: 'system',
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProjectId: action.payload };
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversationId: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        currentProjectId: state.currentProjectId === action.payload ? null : state.currentProjectId,
      };
    case 'ADD_CONVERSATION':
      return { ...state, conversations: [...state.conversations, action.payload] };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };
    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.payload),
        currentConversationId:
          state.currentConversationId === action.payload ? null : state.currentConversationId,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.conversationId
            ? {
                ...c,
                messages: [...c.messages, action.payload.message],
                updatedAt: new Date(),
                metadata: {
                  ...c.metadata,
                  totalMessages: c.metadata.totalMessages + 1,
                },
              }
            : c
        ),
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === action.payload.messageId ? { ...m, ...action.payload.updates } : m
                ),
              }
            : c
        ),
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'TOGGLE_SETTINGS':
      return { ...state, settingsOpen: !state.settingsOpen };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_API_KEY':
      return {
        ...state,
        apiKeys: {
          ...state.apiKeys,
          [action.payload.providerId]: {
            apiKey: action.payload.apiKey,
            isValid: action.payload.isValid,
          },
        },
      };
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'ADD_MEMORY':
      return {
        ...state,
        user: state.user
          ? { ...state.user, memories: [...(state.user.memories || []), action.payload] }
          : null,
      };
    case 'REMOVE_MEMORY':
      return {
        ...state,
        user: state.user
          ? { ...state.user, memories: state.user.memories?.filter((m) => m.id !== action.payload) || [] }
          : null,
      };
    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
}

// Context Type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Auth Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  // API Key Actions
  addAPIKey: (config: Omit<APIKeyConfig, 'id' | 'createdAt' | 'isValid'>) => void;
  removeAPIKey: (id: string) => void;
  validateAPIKey: (id: string) => Promise<boolean>;
  // Project Actions
  createProject: (name: string, description?: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  // Conversation Actions
  createConversation: (projectId?: string | null, title?: string) => Conversation;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  duplicateConversation: (id: string) => Conversation | null;
  // Message Actions
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'conversationId' | 'createdAt'>) => Message;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  regenerateMessage: (conversationId: string, messageId: string) => void;
  // Navigation
  selectProject: (projectId: string | null) => void;
  selectConversation: (conversationId: string | null) => void;
  // UI Actions
  toggleSidebar: () => void;
  toggleSettings: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setError: (error: AppError | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage Keys
const STORAGE_KEYS = {
  USER: 'multiAI_user',
  PROJECTS: 'multiAI_projects',
  CONVERSATIONS: 'multiAI_conversations',
  THEME: 'multiAI_theme',
  API_KEYS: 'multiAI_apiKeys',
};

// Provider Component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { data: session } = useSession();

  // Sync NextAuth session with app state
  useEffect(() => {
    if (session?.user) {
      const user: User = {
        id: session.user.id || session.user.email!,
        name: session.user.name || '',
        email: session.user.email!,
        avatar: session.user.image || undefined,
        createdAt: new Date(),
        preferences: DEFAULT_USER_PREFERENCES,
      };
      dispatch({ type: 'LOGIN', payload: user });
    }
  }, [session]);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
        const storedConversations = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
        const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);

        if (storedUser) {
          const user = JSON.parse(storedUser);
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }

        if (storedProjects) {
          const projects = JSON.parse(storedProjects);
          projects.forEach((project: Project) => {
            dispatch({ type: 'ADD_PROJECT', payload: project });
          });
        }

        if (storedConversations) {
          const conversations = JSON.parse(storedConversations);
          conversations.forEach((conv: Conversation) => {
            dispatch({ type: 'ADD_CONVERSATION', payload: conv });
          });
        }

        if (storedTheme) {
          dispatch({ type: 'SET_THEME', payload: storedTheme as 'light' | 'dark' | 'system' });
        }

        // Load API keys
        const storedApiKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
        if (storedApiKeys) {
          const apiKeys = JSON.parse(storedApiKeys);
          Object.entries(apiKeys).forEach(([providerId, keyData]) => {
            dispatch({
              type: 'SET_API_KEY',
              payload: { providerId, ...(keyData as { apiKey: string; isValid: boolean }) },
            });
          });
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadStoredData();
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (state.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
    }
  }, [state.user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(state.projects));
  }, [state.projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.conversations));
  }, [state.conversations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (state.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(state.theme);
    }
  }, [state.theme]);

  // Save API keys to localStorage
  useEffect(() => {
    if (Object.keys(state.apiKeys).length > 0) {
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(state.apiKeys));
    }
  }, [state.apiKeys]);

  // Generate unique IDs
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Auth Actions
  const login = useCallback(async (email: string, _password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const user: User = {
        id: generateId(),
        email,
        name: email.split('@')[0],
        createdAt: new Date(),
        preferences: DEFAULT_USER_PREFERENCES,
        apiKeys: [],
        memories: [],
      };
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          code: 'AUTH_ERROR',
          message: 'Failed to login',
          timestamp: new Date(),
        },
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/' });
    localStorage.removeItem(STORAGE_KEYS.USER);
    dispatch({ type: 'SET_USER', payload: null });
  }, []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    if (state.user) {
      dispatch({ type: 'SET_USER', payload: { ...state.user, ...updates } });
    }
  }, [state.user]);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    if (state.user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          ...state.user,
          preferences: { ...state.user.preferences, ...preferences },
        },
      });
    }
  }, [state.user]);

  // API Key Actions
  const addAPIKey = useCallback((config: Omit<APIKeyConfig, 'id' | 'createdAt' | 'isValid'>) => {
    if (state.user) {
      const newKey: APIKeyConfig = {
        ...config,
        id: generateId(),
        createdAt: new Date(),
        isValid: false,
      };
      dispatch({
        type: 'SET_USER',
        payload: {
          ...state.user,
          apiKeys: [...(state.user.apiKeys || []), newKey],
        },
      });
    }
  }, [state.user]);

  const removeAPIKey = useCallback((id: string) => {
    if (state.user) {
      dispatch({
        type: 'SET_USER',
        payload: {
          ...state.user,
          apiKeys: (state.user.apiKeys || []).filter((k) => k.id !== id),
        },
      });
    }
  }, [state.user]);

  const validateAPIKey = useCallback(async (_id: string): Promise<boolean> => {
    // TODO: Implement actual API key validation
    return true;
  }, []);

  // Project Actions
  const createProject = useCallback((name: string, description?: string): Project => {
    const project: Project = {
      id: generateId(),
      name,
      description,
      color: '#3b82f6',
      conversations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
    };
    dispatch({ type: 'ADD_PROJECT', payload: project });
    return project;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, ...updates, updatedAt: new Date() } });
  }, []);

  const deleteProject = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: id });
  }, []);

  const archiveProject = useCallback((id: string) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, isArchived: true } });
  }, []);

  // Conversation Actions
  const createConversation = useCallback((projectId?: string | null, title?: string): Conversation => {
    const conversation: Conversation = {
      id: generateId(),
      projectId: projectId || undefined,
      title: title || 'New Chat',
      messages: [],
      model: state.user?.preferences.defaultModel || 'google/gemini-1.5-flash',
      settings: DEFAULT_CONVERSATION_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      isPinned: false,
      isFavorite: false,
      tags: [],
      metadata: {
        totalTokens: 0,
        totalMessages: 0,
        lastModelUsed: '',
        estimatedCost: 0,
      },
    };
    dispatch({ type: 'ADD_CONVERSATION', payload: conversation });
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversation.id });
    return conversation;
  }, [state.user?.preferences.defaultModel]);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    dispatch({ type: 'UPDATE_CONVERSATION', payload: { id, ...updates } });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  }, []);

  const duplicateConversation = useCallback((id: string): Conversation | null => {
    const original = state.conversations.find((c) => c.id === id);
    if (!original) return null;

    const duplicate: Conversation = {
      ...original,
      id: generateId(),
      title: `${original.title} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_CONVERSATION', payload: duplicate });
    return duplicate;
  }, [state.conversations]);

  // Message Actions
  const addMessage = useCallback((
    conversationId: string,
    messageData: Omit<Message, 'id' | 'conversationId' | 'createdAt'>
  ): Message => {
    const message: Message = {
      ...messageData,
      id: generateId(),
      conversationId,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId, message } });
    return message;
  }, []);

  const updateMessage = useCallback((conversationId: string, messageId: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { conversationId, messageId, updates } });
  }, []);

  const regenerateMessage = useCallback((_conversationId: string, _messageId: string) => {
    // TODO: Implement message regeneration
  }, []);

  // Navigation
  const selectProject = useCallback((projectId: string | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: projectId });
  }, []);

  const selectConversation = useCallback((conversationId: string | null) => {
    dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationId });
  }, []);

  // UI Actions
  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const toggleSettings = useCallback(() => {
    dispatch({ type: 'TOGGLE_SETTINGS' });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  }, []);

  const setError = useCallback((error: AppError | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    updateProfile,
    updatePreferences,
    addAPIKey,
    removeAPIKey,
    validateAPIKey,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    createConversation,
    updateConversation,
    deleteConversation,
    duplicateConversation,
    addMessage,
    updateMessage,
    regenerateMessage,
    selectProject,
    selectConversation,
    toggleSidebar,
    toggleSettings,
    setTheme,
    setError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
