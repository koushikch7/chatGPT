'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { AI_PROVIDERS, AI_MODELS, DEFAULT_USER_PREFERENCES } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import {
  XMarkIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  SwatchIcon,
  BellIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'api-keys' | 'general' | 'appearance' | 'notifications' | 'privacy';

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const { state, dispatch } = useApp();
  const { success, error, info } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('api-keys');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [validationStatus, setValidationStatus] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // General settings state
  const [streamResponses, setStreamResponses] = useState(
    state.user?.preferences?.streamResponses ?? true
  );
  const [autoTitle, setAutoTitle] = useState(
    state.user?.preferences?.autoTitle ?? true
  );
  const [showTokenCounts, setShowTokenCounts] = useState(
    state.user?.preferences?.showTokenCounts ?? true
  );
  const [defaultModel, setDefaultModel] = useState(
    state.user?.preferences?.defaultModel || DEFAULT_USER_PREFERENCES.defaultModel
  );

  // Appearance settings
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(state.theme);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showTimestamps, setShowTimestamps] = useState(
    state.user?.preferences?.showTimestamps ?? true
  );

  if (!isOpen) return null;

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeyInputs((prev) => ({ ...prev, [providerId]: value }));
    setValidationStatus((prev) => ({ ...prev, [providerId]: 'idle' }));
  };

  const validateApiKey = async (providerId: string, apiKey: string) => {
    if (!apiKey.trim()) return;

    setValidationStatus((prev) => ({ ...prev, [providerId]: 'validating' }));

    try {
      // Simple validation - check key format
      let isValid = false;

      // Basic format validation
      if (providerId === 'openrouter' && apiKey.startsWith('sk-or-')) {
        isValid = true;
      } else if (providerId === 'google' && apiKey.startsWith('AI')) {
        isValid = true;
      } else if (providerId === 'anthropic' && apiKey.startsWith('sk-ant-')) {
        isValid = true;
      } else if (providerId === 'openai' && apiKey.startsWith('sk-')) {
        isValid = true;
      } else if (providerId === 'groq' && apiKey.startsWith('gsk_')) {
        isValid = true;
      } else if (apiKey.length > 20) {
        // Generic validation for other providers
        isValid = true;
      }

      // Simulate validation delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (isValid) {
        // Save the API key
        dispatch({
          type: 'SET_API_KEY',
          payload: {
            providerId,
            apiKey,
            isValid: true,
          },
        });
        setValidationStatus((prev) => ({ ...prev, [providerId]: 'valid' }));
      } else {
        setValidationStatus((prev) => ({ ...prev, [providerId]: 'invalid' }));
      }
    } catch {
      setValidationStatus((prev) => ({ ...prev, [providerId]: 'invalid' }));
    }
  };

  const toggleShowKey = (providerId: string) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const removeApiKey = (providerId: string) => {
    dispatch({
      type: 'SET_API_KEY',
      payload: {
        providerId,
        apiKey: '',
        isValid: false,
      },
    });
    setApiKeyInputs((prev) => ({ ...prev, [providerId]: '' }));
    setValidationStatus((prev) => ({ ...prev, [providerId]: 'idle' }));
  };

  const getProviderModels = (providerId: string) => {
    return AI_MODELS.filter((model) => model.provider === providerId);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'api-keys', label: 'API Keys', icon: <KeyIcon className="w-5 h-5" /> },
    { id: 'general', label: 'General', icon: <Cog6ToothIcon className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <SwatchIcon className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <ShieldCheckIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-56 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* API Keys Tab */}
            {activeTab === 'api-keys' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Your API keys are stored locally</p>
                      <p>
                        API keys are encrypted and stored in your browser&apos;s local storage. They are never sent to
                        our servers. You need at least one API key configured to use the chat.
                      </p>
                    </div>
                  </div>
                </div>

                {Object.entries(AI_PROVIDERS).map(([providerId, provider]) => {
                  const savedKey = state.apiKeys[providerId];
                  const inputValue = apiKeyInputs[providerId] ?? (savedKey?.apiKey || '');
                  const status = validationStatus[providerId] || (savedKey?.isValid ? 'valid' : 'idle');
                  const isExpanded = expandedProvider === providerId;
                  const models = getProviderModels(providerId);

                  return (
                    <div
                      key={providerId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        onClick={() => setExpandedProvider(isExpanded ? null : providerId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xl">
                            {provider.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">{provider.name}</span>
                              {status === 'valid' && (
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                              )}
                              {status === 'invalid' && (
                                <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {models.length} model{models.length !== 1 ? 's' : ''} available
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                API Key
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type={showKeys[providerId] ? 'text' : 'password'}
                                    value={inputValue}
                                    onChange={(e) => handleApiKeyChange(providerId, e.target.value)}
                                    placeholder={`Enter your ${provider.name} API key`}
                                    className="w-full px-4 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => toggleShowKey(providerId)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                  >
                                    {showKeys[providerId] ? (
                                      <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                                    ) : (
                                      <EyeIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                </div>
                                <button
                                  onClick={async () => {
                                    await validateApiKey(providerId, inputValue);
                                    const prov = AI_PROVIDERS[providerId as keyof typeof AI_PROVIDERS];
                                    const status = validationStatus[providerId] || 'idle';
                                    if (status === 'valid') {
                                      success('API key saved', `${prov.name} key validated`);
                                    } else if (status === 'invalid') {
                                      error('Invalid API key', 'Check format and try again');
                                    }
                                  }}
                                  disabled={!inputValue || status === 'validating'}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium"
                                >
                                  {status === 'validating' ? 'Validating...' : 'Validate'}
                                </button>
                                {savedKey?.apiKey && (
                                  <button
                                    onClick={() => {
                                      removeApiKey(providerId);
                                      const prov = AI_PROVIDERS[providerId as keyof typeof AI_PROVIDERS];
                                      info('API key removed', `${prov.name} key cleared`);
                                    }}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              {status === 'valid' && (
                                <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                  <CheckCircleIcon className="w-4 h-4" />
                                  API key validated and saved
                                </p>
                              )}
                              {status === 'invalid' && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                  <ExclamationCircleIcon className="w-4 h-4" />
                                  Invalid API key format. Please check and try again.
                                </p>
                              )}
                            </div>

                            <div>
                              <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Get an API key from {provider.name} →
                              </a>
                            </div>

                            {models.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Available Models
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {models.map((model) => (
                                    <div
                                      key={model.id}
                                      className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          {model.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                          {model.contextWindow.toLocaleString()} tokens
                                        </p>
                                      </div>
                                      {model.isFree && (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                                          Free
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Response Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Stream responses</p>
                      <p className="text-sm text-gray-500">Show AI responses as they are generated</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !streamResponses;
                        setStreamResponses(next);
                        if (state.user?.preferences) {
                          dispatch({
                            type: 'UPDATE_USER',
                            payload: { preferences: { ...state.user.preferences, streamResponses: next } },
                          });
                        }
                        info('Setting updated', next ? 'Streaming enabled' : 'Streaming disabled');
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        streamResponses ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          streamResponses ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Auto-generate titles</p>
                      <p className="text-sm text-gray-500">Automatically generate conversation titles</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !autoTitle;
                        setAutoTitle(next);
                        if (state.user?.preferences) {
                          dispatch({
                            type: 'UPDATE_USER',
                            payload: { preferences: { ...state.user.preferences, autoTitle: next } },
                          });
                        }
                        info('Setting updated', next ? 'Auto-title enabled' : 'Auto-title disabled');
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        autoTitle ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          autoTitle ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Show token counts</p>
                      <p className="text-sm text-gray-500">Display token usage for each message</p>
                    </div>
                    <button
                      onClick={() => {
                        const next = !showTokenCounts;
                        setShowTokenCounts(next);
                        if (state.user?.preferences) {
                          dispatch({
                            type: 'UPDATE_USER',
                            payload: { preferences: { ...state.user.preferences, showTokenCounts: next } },
                          });
                        }
                        info('Setting updated', next ? 'Show token counts' : 'Hide token counts');
                      }}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        showTokenCounts ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          showTokenCounts ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Default Model</h4>
                  <select
                    value={defaultModel}
                    onChange={(e) => {
                      const id = e.target.value;
                      setDefaultModel(id);
                      if (state.user?.preferences) {
                        dispatch({
                          type: 'UPDATE_USER',
                          payload: { preferences: { ...state.user.preferences, defaultModel: id } },
                        });
                      }
                      const model = AI_MODELS.find((m) => m.id === id);
                      success('Default model updated', model ? model.name : id);
                    }}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {AI_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({AI_PROVIDERS[model.provider].name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Theme</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTheme(t);
                          dispatch({ type: 'SET_THEME', payload: t });
                          info('Theme updated', t);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                          theme === t
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`w-16 h-10 rounded-md ${
                          t === 'light' ? 'bg-white border border-gray-200' :
                          t === 'dark' ? 'bg-gray-800' :
                          'bg-gradient-to-r from-white to-gray-800'
                        }`} />
                        <span className="text-sm capitalize text-gray-900 dark:text-white">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Font Size</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          fontSize === size
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className={`capitalize text-gray-900 dark:text-white ${
                          size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                        }`}>
                          {size}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Show timestamps</p>
                    <p className="text-sm text-gray-500">Display time next to messages</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !showTimestamps;
                      setShowTimestamps(next);
                      info('Setting updated', next ? 'Show timestamps' : 'Hide timestamps');
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      showTimestamps ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        showTimestamps ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <p className="text-gray-500 dark:text-gray-400">
                  Notification settings will be available in a future update.
                </p>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      <p className="font-medium mb-1">Your data stays on your device</p>
                      <p>
                        All conversations and API keys are stored locally in your browser. We never send your data
                        to our servers. Clearing your browser data will delete all stored information.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      const data = {
                        user: state.user,
                        projects: state.projects,
                        conversations: state.conversations,
                        apiKeys: state.apiKeys,
                        exportedAt: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      const d = new Date();
                      const ts = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                      a.href = url;
                      a.download = `multi-ai-chat-export-${ts}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      success('Export complete', 'Data downloaded as JSON');
                    }}
                    className="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">Export all data</p>
                    <p className="text-sm text-gray-500">Download all your conversations and settings</p>
                  </button>

                  <button
                    onClick={() => {
                      const keys = ['multiAI_user','multiAI_projects','multiAI_conversations','multiAI_theme','multiAI_apiKeys'];
                      keys.forEach((k) => localStorage.removeItem(k));
                      dispatch({ type: 'LOGOUT' });
                      info('All data deleted', 'Local data cleared');
                      onClose();
                    }}
                    className="w-full px-4 py-3 text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <p className="font-medium text-red-600 dark:text-red-400">Delete all data</p>
                    <p className="text-sm text-red-500 dark:text-red-400">Permanently delete all local data</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
