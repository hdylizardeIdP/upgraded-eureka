import { google } from 'googleapis';
import { Task } from './types';

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  userEmail: string;
}

export class GmailIntegration {
  private gmail;
  private auth;
  private userEmail: string;

  constructor(config: GmailConfig) {
    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'http://localhost:3000/api/integrations/google/callback'
    );

    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });

    this.auth = oauth2Client;
    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    this.userEmail = config.userEmail;
  }

  /**
   * Send a task reminder email
   */
  async sendTaskReminder(task: Task): Promise<void> {
    try {
      const subject = `Reminder: ${task.title}`;
      const body = this.generateReminderEmail(task);
      const message = this.createMessage(this.userEmail, this.userEmail, subject, body);

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });
    } catch (error) {
      console.error('Gmail send error:', error);
      throw new Error('Failed to send email reminder');
    }
  }

  /**
   * Send task digest email (daily/weekly summary)
   */
  async sendTaskDigest(tasks: Task[], period: 'daily' | 'weekly'): Promise<void> {
    try {
      const subject = `Your ${period} task digest`;
      const body = this.generateDigestEmail(tasks, period);
      const message = this.createMessage(this.userEmail, this.userEmail, subject, body);

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });
    } catch (error) {
      console.error('Gmail digest error:', error);
      throw new Error('Failed to send task digest');
    }
  }

  /**
   * Generate reminder email HTML
   */
  private generateReminderEmail(task: Task): string {
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleString() : 'No due date';
    const priorityColor = this.getPriorityColor(task.priority);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .task-card { background: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid ${priorityColor}; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; background: ${priorityColor}; color: white; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎤 Task Reminder</h2>
            </div>
            <div class="content">
              <div class="task-card">
                <h3>${task.title}</h3>
                ${task.description ? `<p>${task.description}</p>` : ''}
                <p><strong>Priority:</strong> <span class="priority">${task.priority.toUpperCase()}</span></p>
                <p><strong>Due:</strong> ${dueDate}</p>
                <p><strong>Status:</strong> ${task.status.replace('_', ' ').toUpperCase()}</p>
              </div>
              <p style="margin-top: 20px;">
                Don't forget to complete this task!
              </p>
            </div>
            <div class="footer">
              <p>Sent from Voice Task Manager</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate digest email HTML
   */
  private generateDigestEmail(tasks: Task[], period: string): string {
    const tasksByPriority = {
      urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed'),
      high: tasks.filter(t => t.priority === 'high' && t.status !== 'completed'),
      medium: tasks.filter(t => t.priority === 'medium' && t.status !== 'completed'),
      low: tasks.filter(t => t.priority === 'low' && t.status !== 'completed'),
    };

    const completedCount = tasks.filter(t => t.status === 'completed').length;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; padding: 15px; background: white; border-radius: 6px; }
            .stat-number { font-size: 32px; font-weight: bold; color: #3B82F6; }
            .task-section { margin: 20px 0; }
            .task-item { background: white; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 3px solid #3B82F6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📊 Your ${period.charAt(0).toUpperCase() + period.slice(1)} Task Digest</h2>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${tasks.length}</div>
                  <div>Total Tasks</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${completedCount}</div>
                  <div>Completed</div>
                </div>
                <div class="stat">
                  <div class="stat-number">${tasks.length - completedCount}</div>
                  <div>Pending</div>
                </div>
              </div>

              ${this.renderTaskSection('🔴 Urgent Tasks', tasksByPriority.urgent)}
              ${this.renderTaskSection('🟠 High Priority', tasksByPriority.high)}
              ${this.renderTaskSection('🟡 Medium Priority', tasksByPriority.medium)}
              ${this.renderTaskSection('🟢 Low Priority', tasksByPriority.low)}

              <p style="margin-top: 30px; text-align: center;">
                Keep up the great work! 💪
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
              <p>Sent from Voice Task Manager</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Render a section of tasks by priority
   */
  private renderTaskSection(title: string, tasks: Task[]): string {
    if (tasks.length === 0) return '';

    return `
      <div class="task-section">
        <h3>${title} (${tasks.length})</h3>
        ${tasks.map(task => `
          <div class="task-item">
            <strong>${task.title}</strong>
            ${task.due_date ? `<br><small>Due: ${new Date(task.due_date).toLocaleString()}</small>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Create base64 encoded email message
   */
  private createMessage(from: string, to: string, subject: string, body: string): string {
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ].join('\n');

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Get priority color
   */
  private getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      urgent: '#EF4444',
      high: '#F59E0B',
      medium: '#3B82F6',
      low: '#10B981',
    };
    return colors[priority] || '#3B82F6';
  }
}

/**
 * Create a Gmail integration instance
 */
export function createGmailClient(
  clientId?: string,
  clientSecret?: string,
  refreshToken?: string,
  userEmail?: string
): GmailIntegration | null {
  const id = clientId || process.env.GOOGLE_CLIENT_ID;
  const secret = clientSecret || process.env.GOOGLE_CLIENT_SECRET;
  const email = userEmail || process.env.USER_EMAIL;

  if (!id || !secret || !refreshToken || !email) {
    return null;
  }

  return new GmailIntegration({
    clientId: id,
    clientSecret: secret,
    refreshToken,
    userEmail: email,
  });
}
