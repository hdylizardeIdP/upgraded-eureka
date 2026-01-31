'use client';

import { useState, useEffect } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import TaskList from '@/components/TaskList';
import IntegrationSettings from '@/components/IntegrationSettings';
import { Task, Category } from '@/lib/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'integrations'>('tasks');

  // Load tasks and categories on mount
  useEffect(() => {
    loadTasks();
    loadCategories();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setProcessingStatus('Uploading audio...');

    try {
      // Upload audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-memo.webm');

      const uploadResponse = await fetch('/api/voice-memos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio');
      }

      const { voiceMemo } = await uploadResponse.json();

      // Transcribe and extract tasks
      setProcessingStatus('Transcribing and extracting tasks...');

      const transcribeResponse = await fetch('/api/voice-memos/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceMemoId: voiceMemo.id }),
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { tasks: newTasks, summary } = await transcribeResponse.json();

      setProcessingStatus('Done! ✓');

      // Show summary briefly
      if (summary) {
        setTimeout(() => {
          alert(`Tasks extracted:\n\n${summary}`);
        }, 500);
      }

      // Reload tasks
      await loadTasks();
      await loadCategories();

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStatus('');
      }, 2000);
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process voice memo. Please try again.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete task');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎤 Voice Task Manager
          </h1>
          <p className="text-gray-600">
            Speak your tasks, let AI organize them
          </p>
        </header>

        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-700 font-medium">{processingStatus}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-lg p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Tasks
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'integrations'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔗 Integrations
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tasks' ? (
          <>
            {/* Voice Recorder */}
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onTranscriptionStart={() => setProcessingStatus('Processing...')}
            />

            {/* Task List */}
            <TaskList
              tasks={tasks}
              categories={categories}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
            />
          </>
        ) : (
          <IntegrationSettings />
        )}

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-2xl font-bold text-gray-600">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
