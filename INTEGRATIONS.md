# Integration Setup Guide

This guide will help you set up integrations with Notion, Google Calendar, and Gmail.

## Table of Contents
- [Notion Integration](#notion-integration)
- [Google Calendar Integration](#google-calendar-integration)
- [Gmail Integration](#gmail-integration)
- [Usage Examples](#usage-examples)

---

## Notion Integration

Sync your tasks to a Notion database automatically.

### Prerequisites
- A Notion account (free or paid)
- A Notion integration/API key
- A Notion database

### Setup Steps

#### 1. Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in the details:
   - **Name**: Voice Task Manager
   - **Associated workspace**: Select your workspace
   - **Capabilities**: Check "Read content", "Update content", and "Insert content"
4. Click **Submit**
5. Copy the **Internal Integration Token** (starts with `secret_...`)

#### 2. Create a Notion Database

1. In Notion, create a new page
2. Add a database (type `/database` and select "Table - Inline")
3. Add the following properties to your database:
   - **Name** (Title) - Already exists
   - **Status** (Select) - Add options: To Do, In Progress, Done, Cancelled
   - **Priority** (Select) - Add options: Low, Medium, High, Urgent
   - **Description** (Text)
   - **Due Date** (Date)

#### 3. Share Database with Integration

1. Open your database page
2. Click the **...** menu in the top right
3. Scroll down and click **"Add connections"**
4. Select your integration (Voice Task Manager)

#### 4. Get Database ID

1. Open your database as a full page
2. Copy the URL - it will look like:
   ```
   https://www.notion.so/workspace/abc123def456?v=...
   ```
3. The database ID is the part between the last `/` and the `?`
   - In this example: `abc123def456`

#### 5. Configure in App

1. Open the Voice Task Manager app
2. Go to the **Integrations** tab
3. Find the **Notion** section
4. Enter:
   - **Notion API Key**: Your integration token (`secret_...`)
   - **Database ID**: Your database ID
5. Click **Connect Notion**

#### 6. Test the Integration

1. Go to the **Tasks** tab
2. Select a task
3. Click the **📝** button to sync to Notion
4. Check your Notion database - the task should appear!

---

## Google Calendar Integration

Automatically create calendar events for tasks with due dates.

### Prerequisites
- A Google account
- Google Cloud Console project with Calendar API enabled

### Setup Steps

#### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

#### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Voice Task Manager
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `https://www.googleapis.com/auth/calendar.events`
4. Back in Credentials, create OAuth client ID:
   - Application type: **Web application**
   - Name: Voice Task Manager
   - Authorized redirect URIs:
     - `http://localhost:3000/api/integrations/google/callback` (for development)
     - `https://your-domain.com/api/integrations/google/callback` (for production)
5. Copy the **Client ID** and **Client Secret**

#### 3. Configure Environment Variables

Add to your `.env.local`:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 4. Connect in App

1. Open the Voice Task Manager app
2. Go to the **Integrations** tab
3. Find **Google Calendar**
4. Click **Connect Google Calendar**
5. Sign in with your Google account
6. Grant permission to access your calendar
7. You'll be redirected back to the app

#### 5. Test the Integration

1. Go to the **Tasks** tab
2. Create or select a task with a due date
3. Click the **📅** button to sync to Google Calendar
4. Check Google Calendar - the event should appear!

---

## Gmail Integration

Send email reminders and task digests.

### Prerequisites
- A Gmail account
- Same Google Cloud project as Calendar (with Gmail API enabled)

### Setup Steps

#### 1. Enable Gmail API

1. In your [Google Cloud Console](https://console.cloud.google.com/)
2. Go to "APIs & Services" > "Library"
3. Search for "Gmail API"
4. Click "Enable"

#### 2. Update OAuth Scopes

1. Go to "APIs & Services" > "OAuth consent screen"
2. Under "Scopes", click "ADD OR REMOVE SCOPES"
3. Add:
   - `https://www.googleapis.com/auth/gmail.send`
4. Save

#### 3. Configure Environment Variables

Add to your `.env.local`:
```env
USER_EMAIL=your-email@gmail.com
```

(Client ID and Secret should already be configured from Calendar setup)

#### 4. Connect in App

1. Open the Voice Task Manager app
2. Go to the **Integrations** tab
3. Find **Gmail**
4. Click **Connect Gmail**
5. Sign in with your Google account (if not already)
6. Grant permission to send emails
7. You'll be redirected back to the app

#### 5. Test the Integration

1. Go to the **Tasks** tab
2. Select a task
3. Click the **📧** button to send an email reminder
4. Check your inbox - you should receive a reminder email!

---

## Usage Examples

### Syncing Tasks

Once integrations are configured, you can sync tasks directly from the task list:

- **📝 Notion**: Click to create/update the task in your Notion database
- **📅 Calendar**: Click to create a calendar event (requires due date)
- **📧 Email**: Click to send yourself a reminder email

### Automatic Syncing

You can modify the code to automatically sync tasks when created:

```typescript
// In src/app/api/voice-memos/transcribe/route.ts
// After creating tasks, add:

for (const task of createdTasks) {
  if (task.due_date) {
    // Auto-sync to calendar
    await fetch('/api/integrations/calendar/sync', {
      method: 'POST',
      body: JSON.stringify({ taskId: task.id }),
    });
  }

  // Auto-sync to Notion
  await fetch('/api/integrations/notion/sync', {
    method: 'POST',
    body: JSON.stringify({ taskId: task.id }),
  });
}
```

### Task Digests

Send yourself daily or weekly task summaries via email:

```bash
# Call the API endpoint
curl -X POST http://localhost:3000/api/integrations/gmail/send-digest \
  -H "Content-Type: application/json" \
  -d '{"period": "daily"}'
```

You can set up a cron job or scheduled task to call this endpoint automatically.

---

## Troubleshooting

### Notion Issues

**Error: "Invalid Notion database ID or API key"**
- Verify your API key is correct
- Ensure the database is shared with your integration
- Check that the database ID is copied correctly

**Task not appearing in Notion**
- Make sure your database has the correct properties (Name, Status, Priority, etc.)
- Check the browser console for error messages

### Google Calendar/Gmail Issues

**OAuth error during sign-in**
- Verify redirect URI matches exactly (including http/https)
- Ensure APIs are enabled in Google Cloud Console
- Check that OAuth consent screen is configured

**"Access denied" error**
- Make sure you granted all requested permissions
- Try disconnecting and reconnecting the integration

**Calendar events not creating**
- Ensure the task has a due date
- Check that you have calendar write permissions
- Verify the Google Calendar API is enabled

### General Issues

**Integration not showing as connected**
- Check your environment variables are set correctly
- Restart the development server after adding new env vars
- Look for errors in the server console

---

## Security Notes

- **Never commit API keys or secrets** to version control
- Keep `.env.local` in `.gitignore`
- For production, use environment variables in your hosting platform (Vercel, etc.)
- Refresh tokens are stored encrypted in the database
- OAuth tokens are never exposed to the client-side

---

## Advanced Configuration

### Custom Notion Properties

You can modify the Notion sync to include custom properties:

Edit `src/lib/notion.ts` and add properties in the `syncTask` method:

```typescript
properties.CustomField = {
  rich_text: [{
    text: { content: 'Custom value' }
  }]
};
```

### Calendar Event Customization

Modify calendar event duration, reminders, etc. in `src/lib/google-calendar.ts`:

```typescript
const event = {
  // ...
  end: {
    dateTime: this.addHours(task.due_date, 2), // 2-hour event
  },
  reminders: {
    overrides: [
      { method: 'email', minutes: 1440 }, // 1 day before
      { method: 'popup', minutes: 60 },
    ],
  },
};
```

### Email Template Customization

Customize reminder emails in `src/lib/gmail.ts`:

```typescript
private generateReminderEmail(task: Task): string {
  // Modify the HTML template here
}
```

---

## Support

If you encounter issues:
1. Check the browser console for client-side errors
2. Check the server logs for API errors
3. Verify all environment variables are set correctly
4. Ensure all APIs are enabled in their respective consoles
5. Try disconnecting and reconnecting the integration

For more help, open an issue on GitHub.
