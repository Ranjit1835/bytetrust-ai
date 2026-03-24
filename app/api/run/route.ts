import { NextResponse } from 'next/server';
import { startApp, stopApp, getAppInfo } from '@/lib/app-runner';

export async function POST(request: Request) {
  try {
    const { projectDir, entryPoint, port } = await request.json();

    if (!projectDir || !entryPoint || !port) {
      return NextResponse.json(
        { error: '"projectDir", "entryPoint", and "port" are required' },
        { status: 400 }
      );
    }

    const { url, appId } = await startApp(projectDir, entryPoint, port);
    return NextResponse.json({ url, appId, port });
  } catch (error) {
    console.error('Run API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start app' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { appId } = await request.json();
    if (!appId) {
      return NextResponse.json({ error: '"appId" is required' }, { status: 400 });
    }
    const stopped = await stopApp(appId);
    return NextResponse.json({ stopped });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stop app' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appId = url.searchParams.get('appId');
  if (!appId) {
    return NextResponse.json({ error: '"appId" query param required' }, { status: 400 });
  }
  const info = getAppInfo(appId);
  if (!info) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }
  return NextResponse.json(info);
}
