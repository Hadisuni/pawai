'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Abstraction over text-to-speech. Implemented today with the browser's free
// built-in Web Speech API; swap the body of `speak` for a fetch to a
// server-side ElevenLabs route later without touching any call site.
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => /Samantha|Female|Google US English/i.test(v.name) && v.lang.startsWith('en')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0] ||
        null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, opts?: { rate?: number; onEnd?: () => void }) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || muted) {
      opts?.onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = opts?.rate ?? 1;
    utter.pitch = 1.02;
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => { setSpeaking(false); opts?.onEnd?.(); };
    utter.onerror = () => { setSpeaking(false); opts?.onEnd?.(); };
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [muted]);

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      if (!m) cancel();
      return !m;
    });
  }, [cancel]);

  return { speak, cancel, speaking, muted, toggleMuted };
}
