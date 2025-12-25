'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AI_MODELS, AI_PROVIDERS } from '@/lib/constants';
import { AIModel, AIProvider } from '@/types';
import {
  ChevronDownIcon,
  CheckIcon,
  SparklesIcon,
  BoltIcon,
  EyeIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  showSettings?: boolean;
}

export default function ModelSelector({ value, onChange, showSettings = true }: ModelSelectorProps) {
  const { state } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | 'all'>('all');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = AI_MODELS.find((m) => m.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter models
  const filteredModels = AI_MODELS.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || model.provider === selectedProvider;
    const matchesFree = !showFreeOnly || model.isFree;
    return matchesSearch && matchesProvider && matchesFree && model.isAvailable;
  });

  // Group models by provider
  const modelsByProvider = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<AIProvider, AIModel[]>);

  // Check if user has API key for provider
  const hasAPIKey = (provider: AIProvider): boolean => {
    return state.user?.apiKeys?.some((k) => k.provider === provider) || false;
  };

  const renderCapabilityIcon = (model: AIModel) => {
    const icons = [];
    if (model.capabilities.vision) {
      icons.push(<EyeIcon key="vision" className="w-3.5 h-3.5" title="Vision" />);
    }
    if (model.capabilities.codeExecution) {
      icons.push(<CodeBracketIcon key="code" className="w-3.5 h-3.5" title="Code Execution" />);
    }
    if (model.capabilities.webSearch) {
      icons.push(<GlobeAltIcon key="web" className="w-3.5 h-3.5" title="Web Search" />);
    }
    if (model.capabilities.functionCalling) {
      icons.push(<BoltIcon key="function" className="w-3.5 h-3.5" title="Function Calling" />);
    }
    return icons;
  };

  const formatPrice = (price: number): string => {
    if (price === 0) return 'Free';
    if (price < 1) return `$${price.toFixed(3)}/M`;
    return `$${price.toFixed(2)}/M`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[200px]"
      >
        <SparklesIcon className="w-5 h-5 text-blue-500" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium truncate">
            {selectedModel?.name || 'Select Model'}
          </div>
          <div className="text-xs text-gray-500">
            {selectedModel ? AI_PROVIDERS[selectedModel.provider].name : 'Choose an AI model'}
          </div>
        </div>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[400px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search and Filters */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Provider Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProvider('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedProvider === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    selectedProvider === provider
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {AI_PROVIDERS[provider].name}
                </button>
              ))}
            </div>

            {/* Free Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFreeOnly}
                onChange={(e) => setShowFreeOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Show free models only</span>
            </label>
          </div>

          {/* Models List */}
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(modelsByProvider).map(([provider, models]) => (
              <div key={provider}>
                <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      {AI_PROVIDERS[provider as AIProvider].name}
                    </span>
                    {!hasAPIKey(provider as AIProvider) && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">No API key</span>
                    )}
                  </div>
                </div>
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      value === model.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {value === model.id ? (
                        <CheckIcon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <SparklesIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{model.name}</span>
                        {model.isFree && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                            FREE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-gray-400">
                          {(model.contextWindow / 1000).toFixed(0)}K context
                        </span>
                        <span className="text-[10px] text-gray-400">
                          In: {formatPrice(model.inputPricing)} • Out: {formatPrice(model.outputPricing)}
                        </span>
                        <div className="flex items-center gap-1 text-gray-400">
                          {renderCapabilityIcon(model)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}

            {filteredModels.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No models found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {showSettings && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Model Parameters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
