import { google } from 'googleapis';
import { Task } from './types';

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class GoogleCalendarIntegration {
  private calendar;
  private auth;

  constructor(config: GoogleCalendarConfig) {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'http://localhost:3000/api/integrations/google/callback' // Redirect URI
    );

    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });

    this.auth = oauth2Client;
    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Create or update a calendar event from a task
   */
  async syncTask(task: Task): Promise<string> {
    if (!task.due_date) {
      throw new Error('Task must have a due date to sync to calendar');
    }

    try {
      const event = {
        summary: task.title,
        description: task.description || '',
        start: {
          dateTime: task.due_date,
          timeZone: 'UTC',
        },
        end: {
          dateTime: this.addHour(task.due_date), // Default 1-hour event
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      // Update existing event or create new one
      if (task.calendar_event_id) {
        const response = await this.calendar.events.update({
          calendarId: 'primary',
          eventId: task.calendar_event_id,
          requestBody: event,
        });
        return response.data.id!;
      } else {
        const response = await this.calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });
        return response.data.id!;
      }
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      throw new Error('Failed to sync task to Google Calendar');
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Google Calendar delete error:', error);
      throw new Error('Failed to delete event from Google Calendar');
    }
  }

  /**
   * List upcoming events
   */
  async listUpcomingEvents(maxResults: number = 10): Promise<any[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Google Calendar list error:', error);
      throw new Error('Failed to list events from Google Calendar');
    }
  }

  /**
   * Generate OAuth URL for initial authentication
   */
  static generateAuthUrl(clientId: string, clientSecret: string, redirectUri: string): string {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiresAt: new Date(tokens.expiry_date!),
    };
  }

  /**
   * Helper: Add one hour to a date string
   */
  private addHour(dateString: string): string {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 1);
    return date.toISOString();
  }
}

/**
 * Create a Google Calendar integration instance
 */
export function createGoogleCalendarClient(
  clientId?: string,
  clientSecret?: string,
  refreshToken?: string
): GoogleCalendarIntegration | null {
  const id = clientId || process.env.GOOGLE_CLIENT_ID;
  const secret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const token = refreshToken;

  if (!id || !secret || !token) {
    return null;
  }

  return new GoogleCalendarIntegration({
    clientId: id,
    clientSecret: secret,
    refreshToken: token,
  });
}
