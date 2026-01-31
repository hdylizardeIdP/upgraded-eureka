import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `voice-memo-${timestamp}.webm`;
    const filePath = `voice-recordings/${fileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await audioFile.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-memos')
      .upload(filePath, arrayBuffer, {
        contentType: audioFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload audio file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voice-memos')
      .getPublicUrl(filePath);

    // Create voice memo record in database
    const { data: voiceMemo, error: dbError } = await supabase
      .from('voice_memos')
      .insert({
        audio_url: urlData.publicUrl,
        file_size: audioFile.size,
        transcription_status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create voice memo record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      voiceMemo,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
