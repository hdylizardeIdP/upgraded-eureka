import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarIntegration } from '@/lib/google-calendar';

/**
 * Initiate Google OAuth flow
 * Query param 'type' can be 'calendar' or 'gmail'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'calendar';

    if (!['calendar', 'gmail'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "calendar" or "gmail"' },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${request.nextUrl.origin}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google OAuth credentials not configured' },
        { status: 500 }
      );
    }

    // Generate OAuth URL with state parameter to identify the integration type
    const authUrl = GoogleCalendarIntegration.generateAuthUrl(
      clientId,
      clientSecret,
      redirectUri
    );

    // Add state parameter to track which integration we're setting up
    const urlWithState = `${authUrl}&state=${type}`;

    // Redirect to Google OAuth
    return NextResponse.redirect(urlWithState);
  } catch (error) {
    console.error('Google auth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    );
  }
}
