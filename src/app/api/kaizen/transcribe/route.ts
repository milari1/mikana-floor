import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

/**
 * Fallback transcription for when the browser lacks the Web Speech API.
 * Audio is sent to OpenAI Whisper and the text returned — the audio is never
 * written to disk or the database (deleted/discarded after transcription).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Transcription is not configured (OPENAI_API_KEY missing).' },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const audio = form.get('audio');
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append('file', audio, 'kaizen.webm');
  upstream.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { text?: string };
  // Audio Blob goes out of scope here — nothing is persisted server-side.
  return NextResponse.json({ text: data.text ?? '' });
}
