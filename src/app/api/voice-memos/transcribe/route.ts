import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { transcribeAudio } from '@/lib/openai';
import { extractTasksFromTranscription } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { voiceMemoId } = await request.json();

    if (!voiceMemoId) {
      return NextResponse.json(
        { error: 'Voice memo ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get voice memo from database
    const { data: voiceMemo, error: fetchError } = await supabase
      .from('voice_memos')
      .select('*')
      .eq('id', voiceMemoId)
      .single();

    if (fetchError || !voiceMemo) {
      return NextResponse.json(
        { error: 'Voice memo not found' },
        { status: 404 }
      );
    }

    // Update status to processing
    await supabase
      .from('voice_memos')
      .update({ transcription_status: 'processing' })
      .eq('id', voiceMemoId);

    // Download audio file from Supabase Storage
    const audioPath = voiceMemo.audio_url.split('/voice-memos/')[1];
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('voice-memos')
      .download(audioPath);

    if (downloadError || !audioData) {
      await supabase
        .from('voice_memos')
        .update({ transcription_status: 'failed' })
        .eq('id', voiceMemoId);

      return NextResponse.json(
        { error: 'Failed to download audio file' },
        { status: 500 }
      );
    }

    // Convert Blob to File for Whisper API
    const audioFile = new File([audioData], 'audio.webm', { type: 'audio/webm' });

    // Transcribe with Whisper
    const transcription = await transcribeAudio(audioFile);

    // Extract tasks using Claude
    const { tasks, summary } = await extractTasksFromTranscription(transcription);

    // Update voice memo with transcription
    await supabase
      .from('voice_memos')
      .update({
        transcription,
        transcription_status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', voiceMemoId);

    // Get or create categories
    const categoryMap = new Map<string, string>();
    for (const task of tasks) {
      if (task.category && !categoryMap.has(task.category)) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', task.category)
          .maybeSingle();

        if (existingCategory) {
          categoryMap.set(task.category, existingCategory.id);
        } else {
          const { data: newCategory } = await supabase
            .from('categories')
            .insert({ name: task.category })
            .select('id')
            .single();

          if (newCategory) {
            categoryMap.set(task.category, newCategory.id);
          }
        }
      }
    }

    // Create tasks in database
    const taskRecords = tasks.map(task => ({
      voice_memo_id: voiceMemoId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      category_id: task.category ? categoryMap.get(task.category) : null,
      due_date: task.dueDate,
      status: 'pending',
    }));

    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(taskRecords)
      .select();

    if (tasksError) {
      console.error('Tasks creation error:', tasksError);
    }

    // Handle tags
    if (createdTasks) {
      for (let i = 0; i < createdTasks.length; i++) {
        const task = createdTasks[i];
        const extractedTask = tasks[i];

        if (extractedTask.tags && extractedTask.tags.length > 0) {
          for (const tagName of extractedTask.tags) {
            // Get or create tag
            let tagId: string;
            const { data: existingTag } = await supabase
              .from('tags')
              .select('id')
              .eq('name', tagName)
              .maybeSingle();

            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const { data: newTag } = await supabase
                .from('tags')
                .insert({ name: tagName })
                .select('id')
                .single();

              if (newTag) {
                tagId = newTag.id;
              } else {
                continue;
              }
            }

            // Link tag to task
            await supabase
              .from('task_tags')
              .insert({ task_id: task.id, tag_id: tagId });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      transcription,
      summary,
      tasks: createdTasks || [],
    });
  } catch (error) {
    console.error('Transcription error:', error);

    // Update status to failed
    const { voiceMemoId } = await request.json();
    if (voiceMemoId) {
      const supabase = getServiceSupabase();
      await supabase
        .from('voice_memos')
        .update({ transcription_status: 'failed' })
        .eq('id', voiceMemoId);
    }

    return NextResponse.json(
      { error: 'Failed to transcribe and process voice memo' },
      { status: 500 }
    );
  }
}
