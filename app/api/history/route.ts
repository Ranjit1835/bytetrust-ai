import { NextResponse } from 'next/server';
import { getAnalyses } from '@/lib/supabase';

export async function GET() {
  try {
    const analyses = await getAnalyses(50);
    return NextResponse.json(analyses);
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
