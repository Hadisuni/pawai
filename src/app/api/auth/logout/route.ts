import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession, SESSION_COOKIE } from '@/lib/server/auth';
import { isDbConfigured } from '@/lib/server/db';

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token && isDbConfigured()) {
    await deleteSession(token);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
