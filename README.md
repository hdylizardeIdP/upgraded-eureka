# 🎤 Voice Task Manager

A modern web application that lets you record voice memos and automatically extracts tasks using AI. Built with Next.js, Supabase, and powered by OpenAI Whisper and Claude API.

## Features

- 🎙️ **Voice Recording**: Record voice memos directly in your browser
- 🤖 **AI-Powered Extraction**: Automatically transcribe and extract tasks using Whisper + Claude
- 📋 **Smart Organization**: Auto-categorize and prioritize tasks
- 🔄 **Integrations**: Sync with Notion, Google Calendar, and Gmail (coming soon)
- 📱 **PWA Support**: Install as a mobile app
- ⚡ **Real-time Updates**: Instant task updates with Supabase

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI Services**:
  - OpenAI Whisper API (transcription)
  - Anthropic Claude API (task extraction)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier)
- OpenAI API key
- Anthropic API key

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd upgraded-eureka
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to Project Settings > API to get your keys
3. Go to SQL Editor and run the schema from `supabase-schema.sql`
4. Create a storage bucket:
   - Go to Storage
   - Create a new bucket called `voice-memos`
   - Make it public (or configure RLS policies)

### 3. Get API Keys

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add credits to your account

**Anthropic API Key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for integrations - coming soon)
NOTION_API_KEY=
NOTION_DATABASE_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Record a Voice Memo**: Click "Start Recording" and speak your tasks
2. **AI Processing**: When you stop, the app will:
   - Upload the audio to Supabase
   - Transcribe it using Whisper
   - Extract tasks using Claude
   - Organize them with categories and priorities
3. **Manage Tasks**: View, edit, complete, or delete tasks
4. **Filter & Organize**: Use filters to view by status or category

### Example Voice Memos

Try saying things like:

- "Remind me to call John tomorrow at 3pm"
- "I need to buy milk and eggs"
- "High priority: finish the project report by Friday"
- "Schedule a team meeting for next week"
- "Don't forget to email Sarah about the proposal"

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel project settings
5. Deploy

The app is now live at your Vercel URL!

### Deploy Anywhere

Since this is a Next.js app, you can deploy to:
- Vercel (recommended)
- Netlify
- Railway
- Any platform supporting Node.js

## Project Structure

```
voice-memo-task-app/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── tasks/         # Task CRUD endpoints
│   │   │   ├── voice-memos/   # Voice memo endpoints
│   │   │   └── categories/    # Category endpoints
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── VoiceRecorder.tsx  # Voice recording UI
│   │   └── TaskList.tsx       # Task management UI
│   └── lib/                   # Utilities
│       ├── supabase.ts        # Supabase client
│       ├── openai.ts          # OpenAI/Whisper integration
│       ├── claude.ts          # Claude API integration
│       └── types.ts           # TypeScript types
├── public/                    # Static assets
├── supabase-schema.sql        # Database schema
├── .env.example               # Environment template
└── package.json
```

## API Endpoints

### Voice Memos
- `POST /api/voice-memos/upload` - Upload audio file
- `POST /api/voice-memos/transcribe` - Transcribe and extract tasks

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `POST /api/tasks` - Create a task
- `PATCH /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category

### Integrations
- `POST /api/integrations/notion/sync` - Sync task to Notion
- `POST /api/integrations/calendar/sync` - Sync task to Google Calendar
- `POST /api/integrations/gmail/send-reminder` - Send email reminder
- `POST /api/integrations/gmail/send-digest` - Send task digest email
- `GET/POST /api/integrations/settings` - Manage integration settings
- `GET /api/integrations/google/auth` - Initiate Google OAuth
- `GET /api/integrations/google/callback` - Google OAuth callback

## Integrations

The app supports the following integrations:

- **📝 Notion**: Sync tasks to your Notion database
- **📅 Google Calendar**: Create calendar events for tasks with due dates
- **📧 Gmail**: Send email reminders and task digests

For detailed setup instructions, see [INTEGRATIONS.md](./INTEGRATIONS.md)

## Roadmap

### Phase 1: MVP ✅
- [x] Voice recording
- [x] Whisper transcription
- [x] Claude task extraction
- [x] Task management UI
- [x] Basic categorization

### Phase 2: Integrations ✅
- [x] Notion sync
- [x] Google Calendar integration
- [x] Gmail reminders
- [x] Integration settings UI
- [ ] Multi-user authentication

### Phase 3: Advanced Features
- [ ] Calendar view
- [ ] Search & advanced filters
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Mobile apps (React Native)
- [ ] Offline support

## Cost Estimation

For personal use (100 voice memos/month):
- **Vercel**: Free tier
- **Supabase**: Free tier (500MB database, 1GB storage)
- **OpenAI Whisper**: ~$0.60/month ($0.006/min × 100 mins)
- **Claude API**: ~$2-5/month (depending on usage)

**Total**: ~$3-6/month for personal use

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT

## Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation

---

Built with ❤️ using Next.js, Supabase, OpenAI, and Claude
