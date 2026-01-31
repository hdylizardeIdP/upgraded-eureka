import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');

    const supabase = getServiceSupabase();
    let query = supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon),
        voice_memo:voice_memos(id, transcription, created_at)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Fetch tasks error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, categoryId, dueDate } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        priority: priority || 'medium',
        category_id: categoryId,
        due_date: dueDate,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Create task error:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Post task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
