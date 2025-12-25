'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  free: boolean;
}

const aiModels: AIModel[] = [
  { id: 'openrouter/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenRouter', free: true },
  { id: 'openrouter/gpt-4', name: 'GPT-4', provider: 'OpenRouter', free: false },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google', free: true },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', free: true },
  // Add more models
];

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState<AIModel>(aiModels[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load API keys from localStorage (in real app, from secure storage)
    const stored = localStorage.getItem('apiKeys');
    if (stored) {
      setApiKeys(JSON.parse(stored));
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate response
      const content = `This is a simulated response from ${selectedModel.name}. In the real app, this would call the AI API with your API key.`;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">AI Models</h3>
        <div className="space-y-2">
          {aiModels.filter(model => model.free).map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`w-full text-left p-3 rounded-lg border ${
                selectedModel.id === model.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{model.name}</div>
              <div className="text-sm text-gray-500">{model.provider}</div>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <h4 className="text-md font-semibold mb-2">API Keys</h4>
          {['openrouter', 'google', 'anthropic'].map(provider => (
            <div key={provider} className="mb-2">
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {provider} API Key
              </label>
              <input
                type="password"
                value={apiKeys[provider] || ''}
                onChange={(e) => {
                  const newKeys = { ...apiKeys, [provider]: e.target.value };
                  setApiKeys(newKeys);
                  localStorage.setItem('apiKeys', JSON.stringify(newKeys));
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter ${provider} API key`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}