import { Client } from '@notionhq/client';
import { Task } from './types';

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export class NotionIntegration {
  private client: Client;
  private databaseId: string;

  constructor(config: NotionConfig) {
    this.client = new Client({ auth: config.apiKey });
    this.databaseId = config.databaseId;
  }

  /**
   * Sync a task to Notion database
   */
  async syncTask(task: Task): Promise<string> {
    try {
      const properties: any = {
        Name: {
          title: [
            {
              text: {
                content: task.title,
              },
            },
          ],
        },
        Status: {
          select: {
            name: this.mapStatus(task.status),
          },
        },
        Priority: {
          select: {
            name: this.capitalizeFirst(task.priority),
          },
        },
      };

      // Add description if available
      if (task.description) {
        properties.Description = {
          rich_text: [
            {
              text: {
                content: task.description,
              },
            },
          ],
        };
      }

      // Add due date if available
      if (task.due_date) {
        properties['Due Date'] = {
          date: {
            start: task.due_date,
          },
        };
      }

      // If task already has a Notion page ID, update it
      if (task.notion_page_id) {
        await this.client.pages.update({
          page_id: task.notion_page_id,
          properties,
        });
        return task.notion_page_id;
      } else {
        // Create new page
        const response = await this.client.pages.create({
          parent: {
            database_id: this.databaseId,
          },
          properties,
        });
        return response.id;
      }
    } catch (error) {
      console.error('Notion sync error:', error);
      throw new Error('Failed to sync task to Notion');
    }
  }

  /**
   * Delete a task from Notion
   */
  async deleteTask(pageId: string): Promise<void> {
    try {
      await this.client.pages.update({
        page_id: pageId,
        archived: true,
      });
    } catch (error) {
      console.error('Notion delete error:', error);
      throw new Error('Failed to delete task from Notion');
    }
  }

  /**
   * Create or verify Notion database
   */
  async verifyDatabase(): Promise<boolean> {
    try {
      const response = await this.client.databases.retrieve({
        database_id: this.databaseId,
      });
      return !!response;
    } catch (error) {
      console.error('Notion database verification error:', error);
      return false;
    }
  }

  /**
   * Helper: Map task status to Notion-friendly format
   */
  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'To Do',
      in_progress: 'In Progress',
      completed: 'Done',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || 'To Do';
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Create a Notion integration instance from environment variables
 */
export function createNotionClient(apiKey?: string, databaseId?: string): NotionIntegration | null {
  const key = apiKey || process.env.NOTION_API_KEY;
  const dbId = databaseId || process.env.NOTION_DATABASE_ID;

  if (!key || !dbId) {
    return null;
  }

  return new NotionIntegration({
    apiKey: key,
    databaseId: dbId,
  });
}
