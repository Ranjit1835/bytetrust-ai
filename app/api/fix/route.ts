import { NextResponse } from 'next/server';
import { fixApp, type GeneratedFile } from '@/lib/app-generator';

export async function POST(request: Request) {
  try {
    const { prompt, files, errors, instruction } = await request.json() as {
      prompt: string;
      files: GeneratedFile[];
      errors: string;
      instruction?: string;
    };

    if (!prompt || !files || !errors) {
      return NextResponse.json(
        { error: '"prompt", "files", and "errors" are required' },
        { status: 400 }
      );
    }

    const fixed = await fixApp(prompt, files, errors, instruction);
    return NextResponse.json(fixed);
  } catch (error) {
    console.error('Fix API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fix failed' },
      { status: 500 }
    );
  }
}
