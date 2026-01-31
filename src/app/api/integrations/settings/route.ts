import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createNotionClient } from '@/lib/notion';

/**
 * GET all integration settings
 */
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data: settings, error } = await supabase
      .from('integration_settings')
      .select('id, integration_type, is_enabled, settings, created_at, updated_at')
      .order('integration_type');

    if (error) {
      console.error('Fetch integration settings error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch integration settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: settings || [] });
  } catch (error) {
    console.error('Get integration settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST create or update integration settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integration_type, is_enabled, access_token, refresh_token, settings } = body;

    if (!integration_type) {
      return NextResponse.json(
        { error: 'Integration type is required' },
        { status: 400 }
      );
    }

    const validTypes = ['notion', 'google_calendar', 'gmail'];
    if (!validTypes.includes(integration_type)) {
      return NextResponse.json(
        { error: 'Invalid integration type' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify Notion database if setting up Notion integration
    if (integration_type === 'notion' && access_token && settings?.database_id) {
      const notionClient = createNotionClient(access_token, settings.database_id);
      if (notionClient) {
        const isValid = await notionClient.verifyDatabase();
        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid Notion database ID or API key' },
            { status: 400 }
          );
        }
      }
    }

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integration_settings')
      .select('id')
      .eq('integration_type', integration_type)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing integration
      const updateData: any = {
        is_enabled: is_enabled !== undefined ? is_enabled : true,
        settings: settings || {},
      };

      if (access_token) updateData.access_token = access_token;
      if (refresh_token) updateData.refresh_token = refresh_token;

      const { data, error } = await supabase
        .from('integration_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new integration
      const { data, error } = await supabase
        .from('integration_settings')
        .insert({
          integration_type,
          is_enabled: is_enabled !== undefined ? is_enabled : true,
          access_token,
          refresh_token,
          settings: settings || {},
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Remove sensitive data from response
    const { access_token: _, refresh_token: __, ...safeResult } = result;

    return NextResponse.json({
      success: true,
      integration: safeResult
    });
  } catch (error) {
    console.error('Save integration settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save integration settings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE integration settings
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integration_type = searchParams.get('type');

    if (!integration_type) {
      return NextResponse.json(
        { error: 'Integration type is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('integration_settings')
      .delete()
      .eq('integration_type', integration_type);

    if (error) {
      console.error('Delete integration error:', error);
      return NextResponse.json(
        { error: 'Failed to delete integration settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
