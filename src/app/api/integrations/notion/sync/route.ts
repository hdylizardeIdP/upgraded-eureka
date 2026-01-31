import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createNotionClient } from '@/lib/notion';

/**
 * Sync a task to Notion
 */
export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get task from database
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get Notion integration settings
    const { data: integration, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'notion')
      .eq('is_enabled', true)
      .maybeSingle();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Notion integration not configured or not enabled' },
        { status: 400 }
      );
    }

    // Create Notion client
    const notionClient = createNotionClient(
      integration.access_token,
      integration.settings.database_id
    );

    if (!notionClient) {
      return NextResponse.json(
        { error: 'Failed to initialize Notion client' },
        { status: 500 }
      );
    }

    // Sync to Notion
    const notionPageId = await notionClient.syncTask(task);

    // Update task with Notion page ID
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        synced_to_notion: true,
        notion_page_id: notionPageId,
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Failed to update task:', updateError);
      return NextResponse.json(
        { error: 'Task synced to Notion but failed to update database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notionPageId,
    });
  } catch (error) {
    console.error('Notion sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync task to Notion' },
      { status: 500 }
    );
  }
}
