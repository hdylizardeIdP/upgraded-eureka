'use client';

import { useState } from 'react';
import { Task, Category } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}

export default function TaskList({
  tasks,
  categories,
  onTaskUpdate,
  onTaskDelete
}: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filter === 'all' || task.status === filter;
    const categoryMatch = !selectedCategory || task.category_id === selectedCategory;
    return statusMatch && categoryMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSyncToNotion = async (taskId: string) => {
    setSyncing(taskId);
    try {
      const response = await fetch('/api/integrations/notion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync to Notion');
      }

      alert('Task synced to Notion successfully!');
      // Trigger task update to refresh the UI
      onTaskUpdate(taskId, {});
    } catch (error: any) {
      alert(error.message || 'Failed to sync to Notion');
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncToCalendar = async (taskId: string) => {
    setSyncing(taskId);
    try {
      const response = await fetch('/api/integrations/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync to Calendar');
      }

      alert('Task synced to Google Calendar successfully!');
      // Trigger task update to refresh the UI
      onTaskUpdate(taskId, {});
    } catch (error: any) {
      alert(error.message || 'Failed to sync to Calendar');
    } finally {
      setSyncing(null);
    }
  };

  const handleSendReminder = async (taskId: string) => {
    setSyncing(taskId);
    try {
      const response = await fetch('/api/integrations/gmail/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reminder');
      }

      alert('Reminder email sent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to send reminder');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No tasks found. Record a voice memo to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={(e) => onTaskUpdate(task.id, {
                        status: e.target.checked ? 'completed' : 'pending'
                      })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                      {task.title}
                    </h3>
                  </div>

                  {task.description && (
                    <p className="text-sm text-gray-600 ml-7 mb-2">{task.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 ml-7">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>

                    {task.due_date && (
                      <span className="text-xs text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(task.due_date)}
                      </span>
                    )}

                    {task.synced_to_notion && (
                      <span className="text-xs bg-black text-white px-2 py-1 rounded">
                        Notion
                      </span>
                    )}

                    {task.synced_to_calendar && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Calendar
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <div className="flex space-x-2">
                    <select
                      value={task.status}
                      onChange={(e) => onTaskUpdate(task.id, { status: e.target.value as any })}
                      className="text-xs px-2 py-1 border rounded"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => onTaskDelete(task.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete task"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Integration Sync Buttons */}
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleSyncToNotion(task.id)}
                      disabled={syncing === task.id || task.synced_to_notion}
                      className="text-xs px-2 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={task.synced_to_notion ? 'Already synced to Notion' : 'Sync to Notion'}
                    >
                      {syncing === task.id ? '...' : '📝'}
                    </button>
                    <button
                      onClick={() => handleSyncToCalendar(task.id)}
                      disabled={syncing === task.id || task.synced_to_calendar || !task.due_date}
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={task.synced_to_calendar ? 'Already synced to Calendar' : !task.due_date ? 'Add due date first' : 'Sync to Calendar'}
                    >
                      {syncing === task.id ? '...' : '📅'}
                    </button>
                    <button
                      onClick={() => handleSendReminder(task.id)}
                      disabled={syncing === task.id}
                      className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      title="Send email reminder"
                    >
                      {syncing === task.id ? '...' : '📧'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
