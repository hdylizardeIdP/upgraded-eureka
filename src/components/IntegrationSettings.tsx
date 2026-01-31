'use client';

import { useState, useEffect } from 'react';
import { IntegrationSettings as IntegrationSettingsType } from '@/lib/types';

interface IntegrationConfig {
  type: 'notion' | 'google_calendar' | 'gmail';
  name: string;
  description: string;
  icon: string;
  requiresOAuth: boolean;
  fields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
  }>;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    type: 'notion',
    name: 'Notion',
    description: 'Sync tasks to a Notion database',
    icon: '📝',
    requiresOAuth: false,
    fields: [
      {
        name: 'api_key',
        label: 'Notion API Key',
        type: 'password',
        placeholder: 'secret_...',
        required: true,
      },
      {
        name: 'database_id',
        label: 'Database ID',
        type: 'text',
        placeholder: 'abc123...',
        required: true,
      },
    ],
  },
  {
    type: 'google_calendar',
    name: 'Google Calendar',
    description: 'Create calendar events from tasks with due dates',
    icon: '📅',
    requiresOAuth: true,
  },
  {
    type: 'gmail',
    name: 'Gmail',
    description: 'Send email reminders and task digests',
    icon: '📧',
    requiresOAuth: true,
  },
];

export default function IntegrationSettings() {
  const [settings, setSettings] = useState<IntegrationSettingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/integrations/settings');
      const data = await response.json();
      setSettings(data.settings || []);
    } catch (error) {
      console.error('Failed to fetch integration settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (type: string, currentStatus: boolean) => {
    setSaving(type);
    try {
      const response = await fetch('/api/integrations/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: type,
          is_enabled: !currentStatus,
        }),
      });

      if (response.ok) {
        await fetchSettings();
      } else {
        alert('Failed to update integration');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      alert('Failed to update integration');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveNotion = async () => {
    setSaving('notion');
    try {
      const response = await fetch('/api/integrations/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_type: 'notion',
          access_token: formData.api_key,
          is_enabled: true,
          settings: {
            database_id: formData.database_id,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Notion integration configured successfully!');
        setFormData({});
        await fetchSettings();
      } else {
        alert(data.error || 'Failed to configure Notion integration');
      }
    } catch (error) {
      console.error('Notion setup error:', error);
      alert('Failed to configure Notion integration');
    } finally {
      setSaving(null);
    }
  };

  const handleConnectGoogle = (type: 'calendar' | 'gmail') => {
    window.location.href = `/api/integrations/google/auth?type=${type}`;
  };

  const handleDisconnect = async (type: string) => {
    if (!confirm(`Are you sure you want to disconnect ${type}?`)) return;

    setSaving(type);
    try {
      const response = await fetch(`/api/integrations/settings?type=${type}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSettings();
      } else {
        alert('Failed to disconnect integration');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect integration');
    } finally {
      setSaving(null);
    }
  };

  const isConfigured = (type: string) => {
    return settings.some(s => s.integration_type === type);
  };

  const isEnabled = (type: string) => {
    const integration = settings.find(s => s.integration_type === type);
    return integration?.is_enabled || false;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Integrations</h2>

      <div className="space-y-6">
        {INTEGRATIONS.map(integration => {
          const configured = isConfigured(integration.type);
          const enabled = isEnabled(integration.type);
          const isSaving = saving === integration.type;

          return (
            <div
              key={integration.type}
              className="border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </div>
                </div>

                {configured && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggle(integration.type, enabled)}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-gray-200'
                      } ${isSaving ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                )}
              </div>

              {/* Notion Configuration Form */}
              {integration.type === 'notion' && !configured && (
                <div className="space-y-4 mt-4">
                  {integration.fields?.map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={e =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleSaveNotion}
                    disabled={
                      isSaving ||
                      !formData.api_key ||
                      !formData.database_id
                    }
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Connecting...' : 'Connect Notion'}
                  </button>
                  <p className="text-xs text-gray-500">
                    Get your API key from{' '}
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Notion Integrations
                    </a>
                  </p>
                </div>
              )}

              {/* Google OAuth */}
              {integration.requiresOAuth && !configured && (
                <button
                  onClick={() =>
                    handleConnectGoogle(
                      integration.type === 'gmail' ? 'gmail' : 'calendar'
                    )
                  }
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Connecting...' : `Connect ${integration.name}`}
                </button>
              )}

              {/* Disconnect Button */}
              {configured && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Connected
                  </span>
                  <button
                    onClick={() => handleDisconnect(integration.type)}
                    disabled={isSaving}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-sm text-blue-900 mb-2">💡 Setup Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Notion: Create a database with Name, Status, Priority, Description, and Due Date properties</li>
          <li>• Google Calendar: Tasks with due dates will be synced automatically</li>
          <li>• Gmail: Set up email reminders and receive daily/weekly task digests</li>
        </ul>
      </div>
    </div>
  );
}
