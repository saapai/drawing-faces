import { NextRequest, NextResponse } from 'next/server';
import { hashIP, anonymousName } from '@/lib/ip';
import { createHash } from 'crypto';

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

interface Comment {
  id: string;
  text: string;
  name: string;
  timestamp: number;
}

export async function GET() {
  const kv = await getKV();
  if (!kv) {
    return NextResponse.json({ comments: [] });
  }

  const raw = await kv.lrange<Comment>('comments:list', 0, -1);
  const comments: Comment[] = (raw || []).map(item => {
    if (typeof item === 'string') {
      try { return JSON.parse(item); } catch { return null; }
    }
    return item;
  }).filter(Boolean);

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const ipHash = hashIP(ip);

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 });
  }
  if (text.length > 800) {
    return NextResponse.json({ error: 'Comment too long.' }, { status: 400 });
  }

  const kv = await getKV();
  if (!kv) {
    // Dev fallback - return a mock comment
    const comment: Comment = {
      id: Date.now().toString(),
      text,
      name: anonymousName(ipHash),
      timestamp: Date.now(),
    };
    return NextResponse.json({ comment });
  }

  const name = anonymousName(ipHash);
  const comment: Comment = {
    id: createHash('sha256').update(`${ipHash}:${Date.now()}`).digest('hex').slice(0, 12),
    text,
    name,
    timestamp: Date.now(),
  };

  await kv.rpush('comments:list', JSON.stringify(comment));

  return NextResponse.json({ comment });
}
