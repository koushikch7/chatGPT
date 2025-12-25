// Core Types for Multi-AI Chat Application

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  preferences: UserPreferences;
  apiKeys?: APIKeyConfig[];
  memories?: UserMemory[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultModel: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
  sendOnEnter?: boolean;
  showTimestamps?: boolean;
  showTokenCounts?: boolean;
  compactMode?: boolean;
  codeTheme?: string;
  language?: string;
  streamResponses?: boolean;
  autoTitle?: boolean;
  customInstructions?: string;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
}

export interface APIKeyConfig {
  id: string;
  provider: AIProvider;
  key: string;
  isValid: boolean;
  lastValidated?: Date;
  createdAt: Date;
  label?: string;
}

export type AIProvider = 
  | 'openrouter'
  | 'google'
  | 'anthropic'
  | 'openai'
  | 'mistral'
  | 'groq'
  | 'together'
  | 'perplexity';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputPricing: number; // per 1M tokens
  outputPricing: number; // per 1M tokens
  capabilities: ModelCapabilities;
  isFree: boolean;
  isAvailable: boolean;
}

export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  functionCalling: boolean;
  streaming: boolean;
  codeExecution: boolean;
  webSearch: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  conversations: string[]; // conversation IDs
  systemPrompt?: string;
  defaultModel?: string;
  settings?: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isPinned: boolean;
}

export interface ProjectSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
}

export interface Conversation {
  id: string;
  projectId?: string;
  title: string;
  messages: Message[];
  model: string;
  systemPrompt?: string;
  settings: ConversationSettings;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  metadata: ConversationMetadata;
}

export interface ConversationSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
  streamResponse: boolean;
}

export interface ConversationMetadata {
  totalTokens: number;
  totalMessages: number;
  lastModelUsed: string;
  estimatedCost: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  metadata: MessageMetadata;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  parentId?: string; // for regenerated messages
  versions?: MessageVersion[];
}

export interface MessageVersion {
  id: string;
  content: string;
  createdAt: Date;
  model: string;
}

export interface MessageMetadata {
  model: string;
  tokens: TokenUsage;
  processingTime: number;
  finishReason?: string;
  error?: MessageError;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface MessageError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'code' | 'audio';
  name: string;
  url: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

export interface UserMemory {
  id: string;
  type?: 'fact' | 'preference' | 'context';
  category?: string;
  content: string;
  source?: string;
  confidence?: number;
  createdAt: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: TemplateVariable[];
  category: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
}

// API Response Types
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  stream?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface ChatCompletionResponse {
  id: string;
  choices: ChatChoice[];
  usage: TokenUsage;
  model: string;
  created: number;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

// UI State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  currentProjectId: string | null;
  currentConversationId: string | null;
  projects: Project[];
  conversations: Conversation[];
  apiKeys: Record<string, { apiKey: string; isValid: boolean }>;
  isLoading: boolean;
  error: AppError | null;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// Action Types for Reducers
export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'SET_CURRENT_PROJECT'; payload: string | null }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: string | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Partial<Project> & { id: string } }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'UPDATE_CONVERSATION'; payload: Partial<Conversation> & { id: string } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { conversationId: string; messageId: string; updates: Partial<Message> } }
  | { type: 'SET_API_KEY'; payload: { providerId: string; apiKey: string; isValid: boolean } }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'ADD_MEMORY'; payload: UserMemory }
  | { type: 'REMOVE_MEMORY'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };
