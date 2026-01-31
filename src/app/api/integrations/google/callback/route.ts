import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarIntegration } from '@/lib/google-calendar';
import { getServiceSupabase } from '@/lib/supabase';

/**
 * Google OAuth callback handler
 * Handles both Google Calendar and Gmail OAuth flows
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains integration type: 'calendar' or 'gmail'
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_params', request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/?error=missing_google_credentials', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await GoogleCalendarIntegration.getTokensFromCode(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    // Save to database
    const supabase = getServiceSupabase();
    const integrationType = state === 'gmail' ? 'gmail' : 'google_calendar';

    // Check if integration already exists
    const { data: existing } = await supabase
      .from('integration_settings')
      .select('id')
      .eq('integration_type', integrationType)
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabase
        .from('integration_settings')
        .update({
          is_enabled: true,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt.toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('integration_settings')
        .insert({
          integration_type: integrationType,
          is_enabled: true,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt.toISOString(),
          settings: {},
        });
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/?success=${integrationType}_connected`, request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=oauth_failed', request.url)
    );
  }
}
