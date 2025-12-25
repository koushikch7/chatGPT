'use client';

import React, { useState, useCallback } from 'react';
import { Message as MessageType } from '@/types';
import { AI_MODELS } from '@/lib/constants';
import {
  UserCircleIcon,
  SparklesIcon,
  ClipboardIcon,
  CheckIcon,
  PencilIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageProps {
  message: MessageType;
  isStreaming?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
}

export default function Message({
  message,
  isStreaming = false,
  onEdit,
  onRegenerate,
  onRetry,
}: MessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [versionIndex, setVersionIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const model = AI_MODELS.find((m) => m.id === message.metadata.model);
  const hasError = message.metadata.error;
  const hasVersions = message.versions && message.versions.length > 0;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleEditSubmit = useCallback(() => {
    if (onEdit && editContent !== message.content) {
      onEdit(message.id, editContent);
    }
    setIsEditing(false);
  }, [onEdit, editContent, message.content, message.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(date));
  };

  // User message
  if (message.role === 'user') {
    return (
      <div className="flex gap-4 group">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">You</span>
            <span className="text-xs text-gray-500">{formatTimestamp(message.createdAt)}</span>
            {message.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleEditSubmit}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                >
                  Save & Submit
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {/* User message actions */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                title="Edit message"
              >
                <PencilIcon className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                title="Copy message"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <ClipboardIcon className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 dark:text-white">
            {model?.name || 'Assistant'}
          </span>
          <span className="text-xs text-gray-500">{formatTimestamp(message.createdAt)}</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Generating...
            </span>
          )}
        </div>

        {/* Error state */}
        {hasError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{message.metadata.error?.message}</p>
              {message.metadata.error?.retryable && onRetry && (
                <button
                  onClick={() => onRetry(message.id)}
                  className="flex items-center gap-1 mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {!hasError && (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  }
                    
                  return (
                    <div className="relative group/code my-4">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
                        <span className="text-xs text-gray-400">{match[1]}</span>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                        >
                          {copied ? (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardIcon className="w-4 h-4" />
                              Copy code
                            </>
                          )}
                        </button>
                      </div>
                      <SyntaxHighlighter
                          style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                        }}
                          {...(props as { className?: string; children?: React.ReactNode })}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800 font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Version navigation */}
        {hasVersions && (
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <button
              onClick={() => setVersionIndex(Math.max(0, versionIndex - 1))}
              disabled={versionIndex === 0}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span>
              {versionIndex + 1} / {(message.versions?.length || 0) + 1}
            </span>
            <button
              onClick={() => setVersionIndex(Math.min((message.versions?.length || 0), versionIndex + 1))}
              disabled={versionIndex === (message.versions?.length || 0)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Assistant message actions */}
        {!isStreaming && !hasError && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Copy response"
            >
              {copied ? (
                <CheckIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ClipboardIcon className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                title="Regenerate response"
              >
                <ArrowPathIcon className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Good response"
            >
              <HandThumbUpIcon className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Bad response"
            >
              <HandThumbDownIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Token info */}
        {!isStreaming && message.metadata.tokens.total > 0 && (
          <div className="text-xs text-gray-400 mt-2">
            {message.metadata.tokens.total.toLocaleString()} tokens • {message.metadata.processingTime}ms
          </div>
        )}
      </div>
    </div>
  );
}
