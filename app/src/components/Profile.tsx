'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import {
  XMarkIcon,
  UserCircleIcon,
  PencilIcon,
  CameraIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Profile({ isOpen, onClose }: ProfileProps) {
  const { state, dispatch } = useApp();
  const { success, info } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(state.user?.name || '');
  const [email, setEmail] = useState(state.user?.email || '');
  const [customInstructions, setCustomInstructions] = useState(
    state.user?.preferences?.customInstructions || ''
  );
  const [newMemory, setNewMemory] = useState('');

  const memories = state.user?.memories || [];

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (state.user?.preferences) {
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          name,
          email,
          preferences: {
            ...state.user.preferences,
            customInstructions,
          },
        },
      });
      success('Profile updated', 'Your profile changes were saved');
    }
    setIsEditing(false);
  };

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    
    dispatch({
      type: 'ADD_MEMORY',
      payload: {
        id: crypto.randomUUID(),
        content: newMemory,
        createdAt: new Date(),
        category: 'general',
      },
    });
    setNewMemory('');
    info('Memory added', 'Saved to your profile');
  };

  const handleRemoveMemory = (memoryId: string) => {
    dispatch({
      type: 'REMOVE_MEMORY',
      payload: memoryId,
    });
    info('Memory removed', 'Deleted from your profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Profile</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {state.user?.avatar ? (
                  <Image
                    src={state.user.avatar}
                    alt={state.user.name || 'User avatar'}
                    width={96}
                    height={96}
                    unoptimized
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-16 h-16 text-white" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <CameraIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setName(state.user?.name || '');
                        setEmail(state.user?.email || '');
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {state.user?.name || 'Guest User'}
                    </h4>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <PencilIcon className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <p className="text-gray-500">{state.user?.email || 'demo@example.com'}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Member since {new Date(state.user?.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Custom Instructions
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Tell the AI how you&apos;d like it to respond. These instructions apply to all conversations.
              </p>
            </div>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Example: I'm a software engineer. Keep responses concise and include code examples when relevant."
              className="w-full h-32 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (state.user?.preferences) {
                    dispatch({
                      type: 'UPDATE_USER',
                      payload: {
                        preferences: {
                          ...state.user.preferences,
                          customInstructions,
                        },
                      },
                    });
                    success('Instructions saved', 'Custom instructions updated');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                Save Instructions
              </button>
            </div>
          </div>

          {/* Permanent Memories */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Permanent Memories
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Facts about you that the AI will remember across all conversations.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Memories help the AI provide more personalized responses. Add facts like your profession, 
                    preferences, or frequently referenced information.
                  </p>
                </div>
              </div>
            </div>

            {/* Add new memory */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddMemory();
                }}
                placeholder="Add a new memory..."
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddMemory}
                disabled={!newMemory.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Memory list */}
            {memories.length > 0 ? (
              <div className="space-y-2">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{memory.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Added {new Date(memory.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveMemory(memory.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No memories saved yet</p>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Usage Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {state.conversations.length}
                </p>
                <p className="text-sm text-gray-500">Conversations</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {state.projects.length}
                </p>
                <p className="text-sm text-gray-500">Projects</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {state.conversations.reduce((acc, conv) => acc + conv.messages.length, 0)}
                </p>
                <p className="text-sm text-gray-500">Messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
