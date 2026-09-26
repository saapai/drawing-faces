import { NextRequest, NextResponse } from 'next/server';
import { hashIP } from '@/lib/ip';

async function getKV() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import('@upstash/redis');
  return new Redis({ url, token });
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

export async function GET(req: NextRequest) {
  const ip = getIP(req);
  const ipHash = hashIP(ip);

  const kv = await getKV();
  if (!kv) {
    return NextResponse.json({ up: 0, down: 0, vote: null });
  }

  const [up, down, isUp, isDown] = await Promise.all([
    kv.get<number>('votes:up:count'),
    kv.get<number>('votes:down:count'),
    kv.sismember('votes:up:set', ipHash),
    kv.sismember('votes:down:set', ipHash),
  ]);

  return NextResponse.json({
    up: up ?? 0,
    down: down ?? 0,
    vote: isUp === 1 ? 'up' : isDown === 1 ? 'down' : null,
  });
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const ipHash = hashIP(ip);

  let body: { direction?: 'up' | 'down' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const direction = body.direction;
  if (direction !== 'up' && direction !== 'down') {
    return NextResponse.json({ error: 'direction must be up or down' }, { status: 400 });
  }

  const kv = await getKV();
  if (!kv) {
    return NextResponse.json({ up: 0, down: 0, vote: null });
  }

  const opposite = direction === 'up' ? 'down' : 'up';
  const [isCurrent, isOpposite] = await Promise.all([
    kv.sismember(`votes:${direction}:set`, ipHash),
    kv.sismember(`votes:${opposite}:set`, ipHash),
  ]);

  const pipe = kv.pipeline();

  if (isOpposite === 1) {
    pipe.srem(`votes:${opposite}:set`, ipHash);
    pipe.decr(`votes:${opposite}:count`);
  }

  if (isCurrent === 1) {
    pipe.srem(`votes:${direction}:set`, ipHash);
    pipe.decr(`votes:${direction}:count`);
  } else {
    pipe.sadd(`votes:${direction}:set`, ipHash);
    pipe.incr(`votes:${direction}:count`);
  }

  await pipe.exec();

  const [up, down] = await Promise.all([
    kv.get<number>('votes:up:count'),
    kv.get<number>('votes:down:count'),
  ]);

  return NextResponse.json({
    up: Math.max(0, up ?? 0),
    down: Math.max(0, down ?? 0),
    vote: isCurrent === 1 ? null : direction,
  });
}
