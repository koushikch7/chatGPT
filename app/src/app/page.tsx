'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ChatProvider } from '@/context/ChatContext';
import { ToastProvider } from '@/components/Toast';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import Settings from '@/components/Settings';
import Profile from '@/components/Profile';
import {
  Bars3Icon,
  Cog6ToothIcon,
  UserCircleIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

function MainApp() {
  const { state, dispatch } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if user needs onboarding (no API keys configured)
  const hasApiKeys = Object.values(state.apiKeys).some((key) => key?.isValid);

  // Auto-open settings if no API keys are configured
  useEffect(() => {
    if (state.isAuthenticated && !hasApiKeys) {
      setSettingsOpen(true);
    }
  }, [state.isAuthenticated, hasApiKeys]);

  // Login handler for demo
  const handleLogin = () => {
    dispatch({
      type: 'LOGIN',
      payload: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        createdAt: new Date(),
        preferences: {
          theme: 'system',
          defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
          streamResponses: true,
          showTimestamps: true,
        },
      },
    });
  };

  // Logout handler
  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setShowUserMenu(false);
  };

  // Show login screen if not authenticated
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to AI Chat
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your personal AI assistant powered by multiple providers
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue as Demo User
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  or sign in with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => signIn('google')}
                className="py-2.5 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
              >
                Google
              </button>
              <button
                onClick={() => signIn('github')}
                className="py-2.5 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors"
              >
                GitHub
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Multiple AI providers (OpenRouter, Gemini, Claude, GPT)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Project-based conversation organization
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Secure local API key storage
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Custom instructions &amp; memories
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700 flex-shrink-0`}
      >
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} onOpenProfile={() => setProfileOpen(true)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">AI Chat</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasApiKeys && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-sm font-medium rounded-lg flex items-center gap-2"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Configure API Keys
              </button>
            )}
            
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-5 h-5 text-white" />
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {state.user?.name}
                      </p>
                      <p className="text-sm text-gray-500">{state.user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setProfileOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <UserCircleIcon className="w-5 h-5" />
                        Your Profile
                      </button>
                      <button
                        onClick={() => {
                          setSettingsOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        Settings
                      </button>
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <ChatProvider>
          <ChatInterface onOpenSettings={() => setSettingsOpen(true)} />
        </ChatProvider>
      </div>

      {/* Settings Modal */}
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Profile Modal */}
      <Profile isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AppProvider>
  );
}
