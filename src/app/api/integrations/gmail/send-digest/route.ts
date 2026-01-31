import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createGmailClient } from '@/lib/gmail';

/**
 * Send task digest email (daily or weekly summary)
 */
export async function POST(request: NextRequest) {
  try {
    const { period } = await request.json();

    if (!period || !['daily', 'weekly'].includes(period)) {
      return NextResponse.json(
        { error: 'Period must be either "daily" or "weekly"' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    // Get tasks from the period
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (tasksError) {
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { message: 'No tasks to include in digest' },
        { status: 200 }
      );
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

    // Send digest email
    await gmailClient.sendTaskDigest(tasks, period);

    return NextResponse.json({
      success: true,
      message: `${period.charAt(0).toUpperCase() + period.slice(1)} digest sent successfully`,
      taskCount: tasks.length,
    });
  } catch (error) {
    console.error('Gmail digest error:', error);
    return NextResponse.json(
      { error: 'Failed to send digest email' },
      { status: 500 }
    );
  }
}
