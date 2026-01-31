import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  dueDate?: string; // ISO date string
  tags?: string[];
}

export interface TaskExtractionResult {
  tasks: ExtractedTask[];
  summary: string;
}

export async function extractTasksFromTranscription(
  transcription: string
): Promise<TaskExtractionResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a task extraction assistant. Analyze the following voice memo transcription and extract all tasks, action items, reminders, or things to remember.

For each task, determine:
1. A clear, concise title
2. Any additional description or context
3. Priority level (low, medium, high, urgent) based on keywords like "ASAP", "urgent", "when you get a chance", etc.
4. Suggested category (Work, Personal, Shopping, Health, Ideas, or suggest a new one)
5. Due date if mentioned (extract from natural language like "tomorrow", "next week", "Monday at 3pm")
6. Relevant tags

Transcription:
"""
${transcription}
"""

Respond ONLY with valid JSON in this exact format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Additional context",
      "priority": "medium",
      "category": "Work",
      "dueDate": "2026-02-01T15:00:00Z",
      "tags": ["tag1", "tag2"]
    }
  ],
  "summary": "Brief summary of what was captured"
}

If no tasks are found, return empty tasks array. Always include the summary.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const result: TaskExtractionResult = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error('Task extraction error:', error);
    throw new Error('Failed to extract tasks from transcription');
  }
}

export { anthropic };
