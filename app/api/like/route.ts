import { NextRequest, NextResponse } from 'next/server';
import { hashIP } from '@/lib/ip';

// Graceful KV wrapper - works without env vars in dev
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
    return NextResponse.json({ count: 0, liked: false });
  }

  const [count, liked] = await Promise.all([
    kv.get<number>('likes:count') ?? 0,
    kv.sismember('likes:set', ipHash),
  ]);

  return NextResponse.json({
    count: count ?? 0,
    liked: liked === 1,
  });
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const ipHash = hashIP(ip);

  const kv = await getKV();
  if (!kv) {
    return NextResponse.json({ count: 0, liked: false });
  }

  const isLiked = await kv.sismember('likes:set', ipHash);

  let count: number;
  let liked: boolean;

  if (isLiked === 1) {
    // Unlike
    await Promise.all([
      kv.srem('likes:set', ipHash),
      kv.decr('likes:count'),
    ]);
    const newCount = await kv.get<number>('likes:count') ?? 0;
    count = Math.max(0, newCount);
    liked = false;
  } else {
    // Like
    await Promise.all([
      kv.sadd('likes:set', ipHash),
      kv.incr('likes:count'),
    ]);
    const newCount = await kv.get<number>('likes:count') ?? 1;
    count = newCount;
    liked = true;
  }

  return NextResponse.json({ count, liked });
}
