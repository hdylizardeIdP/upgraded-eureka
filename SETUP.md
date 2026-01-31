# Quick Setup Guide

This guide will help you get the Voice Task Manager up and running.

## Prerequisites

Before you start, make sure you have:
- Node.js 18 or higher installed
- npm or yarn package manager
- A Supabase account (free tier is fine)
- OpenAI API account with credits
- Anthropic API account

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (takes ~2 minutes)
3. Go to **Project Settings** > **API** and copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### 3. Create the Database

1. In your Supabase project, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to execute the schema

### 4. Create Storage Bucket

1. In Supabase, go to **Storage**
2. Click **New Bucket**
3. Name it: `voice-memos`
4. Make it **public** (or configure RLS policies if you prefer)
5. Click **Create**

### 5. Get API Keys

**OpenAI:**
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy it immediately (you won't see it again!)
4. Add credits to your account if needed

**Anthropic:**
1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Copy the key

### 6. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your keys:
   ```env
   # From Supabase Project Settings > API
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # From OpenAI
   OPENAI_API_KEY=sk-...

   # From Anthropic
   ANTHROPIC_API_KEY=sk-ant-api03-...

   # These are optional for now
   NOTION_API_KEY=
   NOTION_DATABASE_ID=
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

   # App config
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

### 8. Test the App

1. Click **"Start Recording"**
2. Say something like: "Remind me to call John tomorrow at 3pm and buy milk"
3. Click **"Stop & Process"**
4. Watch as the app transcribes your voice and extracts tasks!

## Troubleshooting

### Build Errors
- Make sure all environment variables are set in `.env.local`
- Try deleting `.next` folder and running `npm run dev` again

### Voice Recording Not Working
- Make sure you allow microphone access in your browser
- Check browser console for errors
- Try using Chrome or Edge (best compatibility)

### Transcription Fails
- Verify your OpenAI API key is correct
- Make sure you have credits in your OpenAI account
- Check the browser console and terminal for error messages

### Task Extraction Fails
- Verify your Anthropic API key is correct
- Make sure you have credits in your Anthropic account

### Supabase Errors
- Double-check all three Supabase environment variables
- Make sure the storage bucket `voice-memos` exists
- Verify the database schema was created successfully

## Next Steps

Once everything is working:
1. Try different voice commands
2. Organize tasks by category
3. Mark tasks as complete
4. Set up Notion integration (see README.md)
5. Deploy to Vercel (see README.md)

## Cost Estimate

For personal use (testing/development):
- **Supabase**: Free
- **Vercel**: Free
- **OpenAI Whisper**: ~$0.006 per minute of audio
- **Anthropic Claude**: ~$0.015 per request (varies by usage)

Example: 100 one-minute voice memos = ~$2.10/month

## Need Help?

- Check the main [README.md](README.md) for more details
- Review the [supabase-schema.sql](supabase-schema.sql) if database setup fails
- Open an issue on GitHub if you find a bug
