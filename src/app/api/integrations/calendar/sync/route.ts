import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createGoogleCalendarClient } from '@/lib/google-calendar';

/**
 * Sync a task to Google Calendar
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

    // Check if task has a due date
    if (!task.due_date) {
      return NextResponse.json(
        { error: 'Task must have a due date to sync to calendar' },
        { status: 400 }
      );
    }

    // Get Google Calendar integration settings
    const { data: integration, error: integrationError } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('integration_type', 'google_calendar')
      .eq('is_enabled', true)
      .maybeSingle();

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Google Calendar integration not configured or not enabled' },
        { status: 400 }
      );
    }

    // Create Google Calendar client
    const calendarClient = createGoogleCalendarClient(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      integration.refresh_token
    );

    if (!calendarClient) {
      return NextResponse.json(
        { error: 'Failed to initialize Google Calendar client' },
        { status: 500 }
      );
    }

    // Sync to Google Calendar
    const eventId = await calendarClient.syncTask(task);

    // Update task with calendar event ID
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        synced_to_calendar: true,
        calendar_event_id: eventId,
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Failed to update task:', updateError);
      return NextResponse.json(
        { error: 'Task synced to calendar but failed to update database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventId,
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync task to Google Calendar' },
      { status: 500 }
    );
  }
}
