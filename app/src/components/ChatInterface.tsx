'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useChat } from '@/context/ChatContext';
import { Conversation } from '@/types';
import { AI_MODELS } from '@/lib/constants';
import ModelSelector from './ModelSelector';
import MessageComponent from './Message';
import {
  PaperAirplaneIcon,
  StopIcon,
  PaperClipIcon,
  PhotoIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ChatInterfaceProps {
  onOpenSettings: () => void;
}

export default function ChatInterface({ onOpenSettings }: ChatInterfaceProps) {
  const { state, updateConversation, createConversation } = useApp();
  const { isStreaming, currentResponse, sendMessage, stopGeneration, regenerateLastResponse } = useChat();

  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConversation: Conversation | null = state.currentConversationId
    ? state.conversations.find((c) => c.id === state.currentConversationId) || null
    : null;

  const currentModel = currentConversation
    ? AI_MODELS.find((m) => m.id === currentConversation.model)
    : AI_MODELS.find((m) => m.id === state.user?.preferences.defaultModel);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages, currentResponse]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    // Create conversation if none exists
    if (!currentConversation) {
      createConversation(state.currentProjectId);
    }

    const message = input;
    setInput('');
    setAttachments([]);
    
    // Wait for state to update
    setTimeout(() => {
      sendMessage(message, attachments);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && state.user?.preferences.sendOnEnter !== false) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleModelChange = (modelId: string) => {
    if (currentConversation) {
      updateConversation(currentConversation.id, { model: modelId });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSettingsChange = (key: keyof Conversation['settings'], value: number | string[] | boolean) => {
    if (currentConversation) {
      updateConversation(currentConversation.id, {
        settings: { ...currentConversation.settings, [key]: value },
      });
    }
  };

  // Empty state
  if (!currentConversation || currentConversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <ModelSelector
            value={currentConversation?.model || state.user?.preferences.defaultModel || 'google/gemini-1.5-flash'}
            onChange={handleModelChange}
          />
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            How can I help you today?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
            Start a conversation with {currentModel?.name || 'an AI model'}. I can help with writing, analysis, coding, math, and more.
          </p>

          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
            {[
              { icon: '✍️', title: 'Help me write', description: 'Draft emails, articles, or creative content' },
              { icon: '💻', title: 'Write code', description: 'Generate, debug, or explain code' },
              { icon: '📊', title: 'Analyze data', description: 'Extract insights and create summaries' },
              { icon: '🧠', title: 'Brainstorm ideas', description: 'Generate creative solutions and concepts' },
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion.description)}
                className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left"
              >
                <span className="text-2xl">{suggestion.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{suggestion.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-sm"
                    >
                      {file.type.startsWith('image/') ? (
                        <PhotoIcon className="w-4 h-4" />
                      ) : (
                        <PaperClipIcon className="w-4 h-4" />
                      )}
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
              />

              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,.txt,.md,.csv,.json"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <PaperClipIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-lg transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-gray-500 mt-2">
              {currentModel?.name} can make mistakes. Consider checking important information.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Conversation View
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <ModelSelector
            value={currentConversation.model}
            onChange={handleModelChange}
          />
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {currentConversation.metadata.totalTokens.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Temperature</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={currentConversation.settings.temperature}
                onChange={(e) => handleSettingsChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{currentConversation.settings.temperature}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Max Tokens</label>
              <input
                type="number"
                value={currentConversation.settings.maxTokens}
                onChange={(e) => handleSettingsChange('maxTokens', parseInt(e.target.value) || 1024)}
                className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Top P</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={currentConversation.settings.topP}
                onChange={(e) => handleSettingsChange('topP', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{currentConversation.settings.topP}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Stream</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentConversation.settings.streamResponse}
                  onChange={(e) => handleSettingsChange('streamResponse', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Enable streaming</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {currentConversation.messages.map((message) => (
            <MessageComponent
              key={message.id}
              message={message}
              isStreaming={false}
            />
          ))}
          {isStreaming && currentResponse && (
            <MessageComponent
              message={{
                id: 'streaming',
                conversationId: currentConversation.id,
                role: 'assistant',
                content: currentResponse,
                isEdited: false,
                createdAt: new Date(),
                metadata: {
                  model: currentConversation.model,
                  tokens: { prompt: 0, completion: 0, total: 0 },
                  processingTime: 0,
                },
              }}
              isStreaming={true}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Regenerate Button */}
      {currentConversation.messages.length > 0 && !isStreaming && (
        <div className="flex justify-center py-2">
          <button
            onClick={regenerateLastResponse}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Regenerate response
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <PhotoIcon className="w-4 h-4" />
                    ) : (
                      <PaperClipIcon className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              disabled={isStreaming}
              className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 disabled:opacity-50"
            />

            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.txt,.md,.csv,.json"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <PaperClipIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  <StopIcon className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-lg transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
