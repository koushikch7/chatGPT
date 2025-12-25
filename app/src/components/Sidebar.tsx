'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Project, Conversation } from '@/types';
import {
  PlusIcon,

  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  StarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  Bars3Icon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export default function Sidebar({ onOpenSettings, onOpenProfile }: SidebarProps) {
  const {
    state,
    createProject,
    createConversation,
    selectProject,
    selectConversation,
    updateProject,
    deleteProject,
    updateConversation,
    deleteConversation,
    toggleSidebar,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; type: 'project' | 'conversation'; x: number; y: number } | null>(null);

  // Filter conversations and projects based on search
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const filteredProjects = state.projects.filter(
      (p) => !p.isArchived && (p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query))
    );

    const filteredConversations = state.conversations.filter(
      (c) => !c.isArchived && c.title.toLowerCase().includes(query)
    );

    return { projects: filteredProjects, conversations: filteredConversations };
  }, [state.projects, state.conversations, searchQuery]);

  // Group conversations by project
  const conversationsByProject = useMemo(() => {
    const grouped: Record<string, Conversation[]> = { ungrouped: [] };
    
    filteredData.conversations.forEach((conv) => {
      if (conv.projectId) {
        if (!grouped[conv.projectId]) {
          grouped[conv.projectId] = [];
        }
        grouped[conv.projectId].push(conv);
      } else {
        grouped.ungrouped.push(conv);
      }
    });

    // Sort by date (newest first)
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });

    return grouped;
  }, [filteredData.conversations]);

  // Group conversations by time
  const groupedUngroupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups: { label: string; conversations: Conversation[] }[] = [
      { label: 'Today', conversations: [] },
      { label: 'Yesterday', conversations: [] },
      { label: 'Last 7 Days', conversations: [] },
      { label: 'Last 30 Days', conversations: [] },
      { label: 'Older', conversations: [] },
    ];

    conversationsByProject.ungrouped.forEach((conv) => {
      const date = new Date(conv.updatedAt);
      if (date >= today) {
        groups[0].conversations.push(conv);
      } else if (date >= yesterday) {
        groups[1].conversations.push(conv);
      } else if (date >= lastWeek) {
        groups[2].conversations.push(conv);
      } else if (date >= lastMonth) {
        groups[3].conversations.push(conv);
      } else {
        groups[4].conversations.push(conv);
      }
    });

    return groups.filter((g) => g.conversations.length > 0);
  }, [conversationsByProject.ungrouped]);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleNewChat = () => {
    createConversation(state.currentProjectId);
  };

  const handleNewProject = () => {
    if (newProjectName.trim()) {
      const project = createProject(newProjectName.trim());
      setExpandedProjects((prev) => new Set(prev).add(project.id));
      setNewProjectName('');
      setShowNewProjectInput(false);
    }
  };

  const handleRename = (id: string, type: 'project' | 'conversation') => {
    if (editingTitle.trim()) {
      if (type === 'project') {
        updateProject(id, { name: editingTitle.trim() });
      } else {
        updateConversation(id, { title: editingTitle.trim() });
      }
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'project' | 'conversation') => {
    e.preventDefault();
    setContextMenu({ id, type, x: e.clientX, y: e.clientY });
  };

  const handleToggleFavorite = (conv: Conversation) => {
    updateConversation(conv.id, { isFavorite: !conv.isFavorite });
  };

  const handleArchive = (id: string, type: 'project' | 'conversation') => {
    if (type === 'project') {
      updateProject(id, { isArchived: true });
    } else {
      updateConversation(id, { isArchived: true });
    }
    setContextMenu(null);
  };

  const handleDelete = (id: string, type: 'project' | 'conversation') => {
    if (type === 'project') {
      deleteProject(id);
    } else {
      deleteConversation(id);
    }
    setContextMenu(null);
  };

  const renderConversationItem = (conv: Conversation) => (
    <div
      key={conv.id}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        state.currentConversationId === conv.id
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={() => selectConversation(conv.id)}
      onContextMenu={(e) => handleContextMenu(e, conv.id, 'conversation')}
    >
      <ChatBubbleLeftIcon className="w-4 h-4 flex-shrink-0" />
      {editingId === conv.id ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={() => handleRename(conv.id, 'conversation')}
          onKeyDown={(e) => e.key === 'Enter' && handleRename(conv.id, 'conversation')}
          className="flex-1 bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm border border-blue-500"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{conv.title}</span>
      )}
      {conv.isFavorite && (
        <StarIconSolid className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggleFavorite(conv);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
      >
        {conv.isFavorite ? (
          <StarIconSolid className="w-4 h-4 text-yellow-500" />
        ) : (
          <StarIcon className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={(e) => handleContextMenu(e, conv.id, 'conversation')}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
      >
        <EllipsisHorizontalIcon className="w-4 h-4" />
      </button>
    </div>
  );

  if (!state.sidebarOpen) {
    return (
      <div className="w-16 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <button
          onClick={handleNewChat}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </button>
        <button
          onClick={onOpenProfile}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
        >
          <UserCircleIcon className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold">Multi-AI Chat</h1>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* Projects Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</span>
              <button
                onClick={() => setShowNewProjectInput(true)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {showNewProjectInput && (
              <div className="px-2 mb-2">
                <input
                  type="text"
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onBlur={() => {
                    if (!newProjectName.trim()) setShowNewProjectInput(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNewProject();
                    if (e.key === 'Escape') setShowNewProjectInput(false);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-blue-500 rounded-lg text-sm focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {filteredData.projects.map((project) => (
              <div key={project.id} className="mb-1">
                <div
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                    state.currentProjectId === project.id
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    selectProject(project.id);
                    toggleProjectExpand(project.id);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, project.id, 'project')}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProjectExpand(project.id);
                    }}
                    className="p-0.5"
                  >
                    {expandedProjects.has(project.id) ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </button>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  {editingId === project.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRename(project.id, 'project')}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id, 'project')}
                      className="flex-1 bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm border border-blue-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium truncate">{project.name}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {conversationsByProject[project.id]?.length || 0}
                  </span>
                  <button
                    onClick={(e) => handleContextMenu(e, project.id, 'project')}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <EllipsisHorizontalIcon className="w-4 h-4" />
                  </button>
                </div>

                {expandedProjects.has(project.id) && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {conversationsByProject[project.id]?.map(renderConversationItem)}
                    <button
                      onClick={() => createConversation(project.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg w-full"
                    >
                      <PlusIcon className="w-4 h-4" />
                      New chat in project
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recent Chats */}
          <div>
            <div className="px-2 py-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Chats</span>
            </div>
            {groupedUngroupedConversations.map((group) => (
              <div key={group.label} className="mb-3">
                <div className="px-3 py-1">
                  <span className="text-xs text-gray-400">{group.label}</span>
                </div>
                <div className="space-y-0.5">
                  {group.conversations.map(renderConversationItem)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {state.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium truncate">{state.user?.name || 'User'}</div>
                <div className="text-xs text-gray-500 truncate">{state.user?.email || ''}</div>
              </div>
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const item = contextMenu.type === 'project'
                  ? state.projects.find((p) => p.id === contextMenu.id)
                  : state.conversations.find((c) => c.id === contextMenu.id);
                setEditingId(contextMenu.id);
                setEditingTitle(contextMenu.type === 'project' ? (item as Project)?.name || '' : (item as Conversation)?.title || '');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <PencilIcon className="w-4 h-4" />
              Rename
            </button>
            {contextMenu.type === 'conversation' && (
              <button
                onClick={() => {
                  // Duplicate logic would go here
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
                Duplicate
              </button>
            )}
            <button
              onClick={() => handleArchive(contextMenu.id, contextMenu.type)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              Archive
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => handleDelete(contextMenu.id, contextMenu.type)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
