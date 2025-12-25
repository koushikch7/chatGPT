'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Conversation, ChatCompletionRequest, TokenUsage } from '@/types';
import { useApp } from './AppContext';
import { AI_MODELS } from '@/lib/constants';

interface ChatContextType {
  isStreaming: boolean;
  currentResponse: string;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  stopGeneration: () => void;
  regenerateLastResponse: () => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  retryFailedMessage: (messageId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { state, addMessage, updateMessage, updateConversation } = useApp();
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const getCurrentConversation = useCallback((): Conversation | null => {
    if (!state.currentConversationId) return null;
    return state.conversations.find((c) => c.id === state.currentConversationId) || null;
  }, [state.currentConversationId, state.conversations]);

  const getAPIKey = useCallback((modelId: string): string | null => {
    if (!state.user) return null;
    
    const model = AI_MODELS.find((m) => m.id === modelId);
    if (!model) return null;

    const keyConfig = (state.user.apiKeys || []).find((k) => k.provider === model.provider);
    return keyConfig?.key || null;
  }, [state.user]);

  const buildMessages = useCallback((conversation: Conversation, userMessage: string): ChatCompletionRequest['messages'] => {
    const messages: ChatCompletionRequest['messages'] = [];
    
    // Add system prompt if exists
    if (conversation.systemPrompt) {
      messages.push({ role: 'system', content: conversation.systemPrompt });
    }

    // Add user memories as context
    if (state.user?.memories && state.user.memories.length > 0) {
      const activeMemories = state.user.memories.filter((m) => m.isActive);
      if (activeMemories.length > 0) {
        const memoryContext = activeMemories.map((m) => m.content).join('\n');
        messages.push({
          role: 'system',
          content: `User context and preferences:\n${memoryContext}`,
        });
      }
    }

    // Add conversation history
    conversation.messages.forEach((msg) => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // Add new user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }, [state.user?.memories]);

  const callAI = useCallback(async (
    modelId: string,
    messages: ChatCompletionRequest['messages'],
    settings: Conversation['settings'],
    signal: AbortSignal
  ): Promise<{ content: string; usage: TokenUsage }> => {
    const apiKey = getAPIKey(modelId);
    const model = AI_MODELS.find((m) => m.id === modelId);

    if (!model) {
      throw new Error('Model not found');
    }

    // For demo purposes, simulate AI response
    // In production, this would call the actual API
    if (!apiKey) {
      // Simulate response without API key
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 1500);
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Request aborted'));
        });
      });

      const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
      const userContent = typeof lastUserMessage?.content === 'string' 
        ? lastUserMessage.content 
        : 'your message';

      return {
        content: `**Demo Response from ${model.name}**\n\nThis is a simulated response. To get real AI responses, please configure your API key in Settings.\n\nYou asked: "${userContent.substring(0, 100)}${userContent.length > 100 ? '...' : ''}"\n\n---\n*Configure your ${model.provider} API key to enable real conversations.*`,
        usage: { prompt: 100, completion: 50, total: 150 },
      };
    }

    // Real API call logic would go here
    // This is a placeholder for the actual implementation
    let apiUrl: string;
    let headers: Record<string, string>;
    let body: Record<string, unknown>;

    if (model.provider === 'google') {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId.replace('google/', '')}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = {
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : m.role,
          parts: [{ text: typeof m.content === 'string' ? m.content : '' }],
        })),
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens,
          topP: settings.topP,
        },
      };
    } else if (model.provider === 'openrouter' || modelId.startsWith('openrouter/')) {
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      };
      body = {
        model: modelId.replace('openrouter/', ''),
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        top_p: settings.topP,
        stream: false,
      };
    } else if (model.provider === 'groq') {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      body = {
        model: modelId.replace('groq/', ''),
        messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      };
    } else {
      throw new Error(`Provider ${model.provider} not implemented`);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();

    let content: string;
    let usage: TokenUsage;

    if (model.provider === 'google') {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      usage = {
        prompt: data.usageMetadata?.promptTokenCount || 0,
        completion: data.usageMetadata?.candidatesTokenCount || 0,
        total: data.usageMetadata?.totalTokenCount || 0,
      };
    } else {
      content = data.choices?.[0]?.message?.content || '';
      usage = {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      };
    }

    return { content, usage };
  }, [getAPIKey]);

  const sendMessage = useCallback(async (content: string, _attachments?: File[]) => {
    const conversation = getCurrentConversation();
    if (!conversation || !content.trim()) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsStreaming(true);
    setCurrentResponse('');

    // Add user message
    addMessage(conversation.id, {
      role: 'user',
      content: content.trim(),
      isEdited: false,
      metadata: {
        model: conversation.model,
        tokens: { prompt: 0, completion: 0, total: 0 },
        processingTime: 0,
      },
    });

    // Update conversation title if first message
    if (conversation.messages.length === 0) {
      const title = content.trim().substring(0, 50) + (content.length > 50 ? '...' : '');
      updateConversation(conversation.id, { title });
    }

    try {
      const startTime = Date.now();
      const messages = buildMessages(conversation, content);
      
      const { content: responseContent, usage } = await callAI(
        conversation.model,
        messages,
        conversation.settings,
        controller.signal
      );

      const processingTime = Date.now() - startTime;

      // Add assistant message
      addMessage(conversation.id, {
        role: 'assistant',
        content: responseContent,
        isEdited: false,
        metadata: {
          model: conversation.model,
          tokens: usage,
          processingTime,
          finishReason: 'stop',
        },
      });

      // Update conversation metadata
      updateConversation(conversation.id, {
        metadata: {
          ...conversation.metadata,
          totalTokens: conversation.metadata.totalTokens + usage.total,
          lastModelUsed: conversation.model,
        },
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        // Add error message
        addMessage(conversation.id, {
          role: 'assistant',
          content: `Error: ${(error as Error).message}`,
          isEdited: false,
          metadata: {
            model: conversation.model,
            tokens: { prompt: 0, completion: 0, total: 0 },
            processingTime: 0,
            error: {
              code: 'API_ERROR',
              message: (error as Error).message,
              retryable: true,
            },
          },
        });
      }
    } finally {
      setIsStreaming(false);
      setCurrentResponse('');
      setAbortController(null);
    }
  }, [getCurrentConversation, addMessage, updateConversation, buildMessages, callAI]);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  const regenerateLastResponse = useCallback(async () => {
    const conversation = getCurrentConversation();
    if (!conversation || conversation.messages.length < 2) return;

    // Find last assistant message and remove it
    const messages = [...conversation.messages];
    const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
    
    if (lastAssistantIndex === -1) return;

    // Get the user message before the assistant response
    const userMessage = messages[lastAssistantIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;

    // Remove the last assistant message
    updateConversation(conversation.id, {
      messages: messages.slice(0, lastAssistantIndex),
    });

    // Regenerate
    await sendMessage(userMessage.content);
  }, [getCurrentConversation, updateConversation, sendMessage]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const conversation = getCurrentConversation();
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    const message = conversation.messages[messageIndex];
    
    // Update the message
    updateMessage(conversation.id, messageId, {
      content: newContent,
      isEdited: true,
      updatedAt: new Date(),
      versions: [
        ...(message.versions || []),
        { id: message.id, content: message.content, createdAt: message.createdAt, model: message.metadata.model },
      ],
    });

    // If it's a user message, regenerate the response
    if (message.role === 'user') {
      // Remove all messages after this one
      updateConversation(conversation.id, {
        messages: conversation.messages.slice(0, messageIndex + 1).map((m) =>
          m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
        ),
      });

      // Regenerate response
      await sendMessage(newContent);
    }
  }, [getCurrentConversation, updateMessage, updateConversation, sendMessage]);

  const retryFailedMessage = useCallback(async (messageId: string) => {
    const conversation = getCurrentConversation();
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Get the previous user message
    const userMessage = conversation.messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;

    // Remove the failed message
    updateConversation(conversation.id, {
      messages: conversation.messages.slice(0, messageIndex),
    });

    // Retry
    await sendMessage(userMessage.content);
  }, [getCurrentConversation, updateConversation, sendMessage]);

  const value: ChatContextType = {
    isStreaming,
    currentResponse,
    sendMessage,
    stopGeneration,
    regenerateLastResponse,
    editMessage,
    retryFailedMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
