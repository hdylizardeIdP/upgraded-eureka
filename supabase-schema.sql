-- Voice Memo Task App Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for future multi-user support)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Voice memos table
CREATE TABLE voice_memos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  transcription TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voice_memo_id UUID REFERENCES voice_memos(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Integration sync status
  synced_to_notion BOOLEAN DEFAULT FALSE,
  notion_page_id TEXT,
  synced_to_calendar BOOLEAN DEFAULT FALSE,
  calendar_event_id TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task tags (many-to-many relationship)
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE(user_id, name)
);

CREATE TABLE task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Integration settings
CREATE TABLE integration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('notion', 'google_calendar', 'gmail')),
  is_enabled BOOLEAN DEFAULT FALSE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

-- Indexes for performance
CREATE INDEX idx_voice_memos_user_id ON voice_memos(user_id);
CREATE INDEX idx_voice_memos_created_at ON voice_memos(created_at DESC);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_category_id ON tasks(category_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_settings_updated_at BEFORE UPDATE ON integration_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for future auth - currently permissive for single user)
CREATE POLICY "Users can view their own data" ON users
  FOR ALL USING (true);

CREATE POLICY "Users can manage their voice memos" ON voice_memos
  FOR ALL USING (true);

CREATE POLICY "Users can manage their tasks" ON tasks
  FOR ALL USING (true);

CREATE POLICY "Users can manage their categories" ON categories
  FOR ALL USING (true);

CREATE POLICY "Users can manage their tags" ON tags
  FOR ALL USING (true);

CREATE POLICY "Users can manage their task tags" ON task_tags
  FOR ALL USING (true);

CREATE POLICY "Users can manage their integration settings" ON integration_settings
  FOR ALL USING (true);

-- Insert default categories
INSERT INTO categories (id, user_id, name, color, icon) VALUES
  (uuid_generate_v4(), NULL, 'Work', '#3B82F6', '💼'),
  (uuid_generate_v4(), NULL, 'Personal', '#10B981', '🏠'),
  (uuid_generate_v4(), NULL, 'Shopping', '#F59E0B', '🛒'),
  (uuid_generate_v4(), NULL, 'Health', '#EF4444', '❤️'),
  (uuid_generate_v4(), NULL, 'Ideas', '#8B5CF6', '💡');
