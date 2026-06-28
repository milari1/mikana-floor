'use client';

import { Loader2, Mic, Square } from 'lucide-react';
import { useRef, useState } from 'react';

/* Minimal Web Speech typings (not in the standard DOM lib). */
type SpeechResult = { 0: { transcript: string } };
type SpeechEvent = { results: ArrayLike<SpeechResult> };
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

type Status = 'idle' | 'recording' | 'processing';

/**
 * Hold-to-talk voice capture. Uses the Web Speech API when available, falling
 * back to MediaRecorder + server-side Whisper transcription. Calls `onResult`
 * with the final transcript.
 */
export function VoiceCapture({
  lang,
  onResult,
}: {
  lang?: string;
  onResult: (text: string) => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcriptRef = useRef('');

  async function start() {
    if (status !== 'idle') return;

    const recognition = getRecognition();
    if (recognition) {
      transcriptRef.current = '';
      recognition.lang = lang ?? navigator.language ?? 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        transcriptRef.current = text;
      };
      recognition.onend = () => {
        setStatus('idle');
        const text = transcriptRef.current.trim();
        if (text) onResult(text);
      };
      recognition.onerror = () => setStatus('idle');
      recognitionRef.current = recognition;
      recognition.start();
      setStatus('recording');
      return;
    }

    // Fallback: record audio and transcribe server-side.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setStatus('processing');
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const fd = new FormData();
        fd.append('audio', blob, 'kaizen.webm');
        try {
          const res = await fetch('/api/kaizen/transcribe', {
            method: 'POST',
            body: fd,
          });
          const data = (await res.json()) as { text?: string };
          if (data.text) onResult(data.text);
        } finally {
          setStatus('idle');
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setStatus('recording');
    } catch {
      setStatus('idle');
    }
  }

  function stop() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }

  const label =
    status === 'processing'
      ? 'Transcribing…'
      : status === 'recording'
        ? 'Listening… release to stop'
        : 'Hold to talk';

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onPointerDown={start}
        onPointerUp={stop}
        onPointerLeave={stop}
        disabled={status === 'processing'}
        aria-label="Hold to record"
        className={`flex h-40 w-40 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 disabled:opacity-60 ${
          status === 'recording' ? 'bg-red-600' : 'bg-blue-600'
        }`}
      >
        {status === 'processing' ? (
          <Loader2 className="h-16 w-16 animate-spin" aria-hidden />
        ) : status === 'recording' ? (
          <Square className="h-16 w-16" aria-hidden />
        ) : (
          <Mic className="h-16 w-16" aria-hidden />
        )}
      </button>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
