import { runPipeline, type PipelineEvent } from '@/lib/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'A "prompt" string is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: PipelineEvent) => {
        const data = JSON.stringify(event);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        await runPipeline(prompt, sendEvent);
      } catch (err) {
        sendEvent({
          type: 'error',
          message: err instanceof Error ? err.message : 'Pipeline failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
