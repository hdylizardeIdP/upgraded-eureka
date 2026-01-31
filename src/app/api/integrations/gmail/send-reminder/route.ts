import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createGmailClient } from '@/lib/gmail';

/**
 * Send email reminder for a task
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

    // Get Gmail integration settings
    const { data: integration, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'gmail')
      .eq('is_enabled', true)
      .maybeSingle();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Gmail integration not configured or not enabled' },
        { status: 400 }
      );
    }

    // Create Gmail client
    const gmailClient = createGmailClient(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      integration.refresh_token,
      integration.settings.user_email
    );

    if (!gmailClient) {
      return NextResponse.json(
        { error: 'Failed to initialize Gmail client' },
        { status: 500 }
      );
    }

    // Send reminder email
    await gmailClient.sendTaskReminder(task);

    return NextResponse.json({
      success: true,
      message: 'Reminder email sent successfully',
    });
  } catch (error) {
    console.error('Gmail reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder email' },
      { status: 500 }
    );
  }
}
