// src/app/api/feed/route.ts
// SSE relay: bridges the server-only Alchemy/Helius/mock feeds (src/lib/feed.ts)
// to the browser, since those clients rely on non-public env vars and the `ws`
// package and cannot run client-side.

import { NextRequest } from 'next/server';
import { subscribeToFeed } from '@/lib/feed';
import type { Chain } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chain = (searchParams.get('chain') === 'SOL' ? 'SOL' : 'EVM') as Chain;
  const demo = searchParams.get('demo') === 'true';

  if (!address) {
    return new Response('address is required', { status: 400 });
  }

  const encoder = new TextEncoder();
  let active = true;
  let unsubscribe: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = subscribeToFeed(
        chain,
        address,
        (tx) => {
          if (!active) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(tx)}\n\n`));
          } catch {
            active = false;
          }
        },
        { demo }
      );
    },
    cancel() {
      active = false;
      unsubscribe();
    },
  });

  request.signal.addEventListener('abort', () => {
    active = false;
    unsubscribe();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
