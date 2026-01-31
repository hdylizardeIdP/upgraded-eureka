export interface VoiceMemo {
  id: string;
  user_id: string;
  audio_url: string;
  duration_seconds?: number;
  transcription?: string;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  file_size?: number;
  created_at: string;
  processed_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  voice_memo_id?: string;
  category_id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  synced_to_notion: boolean;
  notion_page_id?: string;
  synced_to_calendar: boolean;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  icon?: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

export interface IntegrationSettings {
  id: string;
  user_id: string;
  integration_type: 'notion' | 'google_calendar' | 'gmail';
  is_enabled: boolean;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}
