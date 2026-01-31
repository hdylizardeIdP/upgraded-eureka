import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// GET all categories
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Fetch categories error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        color: color || '#3B82F6',
        icon,
      })
      .select()
      .single();

    if (error) {
      console.error('Create category error:', error);
      return NextResponse.json(
        { error: 'Failed to create category' },
        { status: 500 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Post category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
