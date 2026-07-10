'use client';

import { useEffect, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import type { PetInfo } from '@/lib/session';
import type { RecordEntry } from '@/lib/record';

// The Care Agent is a SEPARATE ElevenLabs agent from the public support
// widget: its prompt, first message, and dynamic-variable contract are
// dashboard-specific. Never fall back to the support agent ID — the support
// agent's phone-intake first message makes no sense mid-dashboard, and the
// two agents' data boundaries (public: zero user data; private: pet-only
// context) must stay independent.
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_CARE_AGENT_ID;
// Launch gate (spec §6.2 R1): the Care Agent only goes live once the
// ElevenLabs prompt update + dynamic variables are verified with a real
// call. Until then a safe placeholder renders — an agent that pretends to
// know the pet would be fake personalization. Both the flag AND the care
// agent ID must be present.
const CARE_AGENT_LIVE = process.env.NEXT_PUBLIC_CARE_AGENT === '1';

type Summary = Extract<RecordEntry, { type: 'summary' }>;
type NavTarget = 'profile' | 'summary' | 'timeline';
type Msg = { speaker: 'ai' | 'owner'; text: string };

// The agent's prompt uses bracketed voice-delivery tags (e.g. "[warmly]") as
// TTS stage directions — meaningful for speech, meaningless as literal text
// in a written transcript, so strip them before display.
function stripVoiceTags(text: string): string {
  return text.replace(/\[[a-z][a-z\s]*\]/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function entryLabel(e: RecordEntry): string {
  switch (e.type) {
    case 'summary': return `Vet-ready summary — ${e.concern} (${e.tier})`;
    case 'weight': return `Weight: ${e.value} ${e.unit}`;
    case 'vaccination': return `Vaccination: ${e.vaccine}${e.nextDue ? ` (next due ${e.nextDue})` : ''}`;
    case 'medication': return `Medication: ${e.name}${e.dose ? ` — ${e.dose}` : ''}`;
    case 'qol': return `Wellness check-in: ${e.score}/5`;
    case 'note': return e.text;
    case 'reminder': return `Reminder: ${e.title}`;
    default: return 'Record entry';
  }
}

// Data minimization (spec §6.2 R2): ONLY pet-care-relevant fields are passed
// to the agent. Owner name, email, phone, and location must never appear
// here — nothing in this function reads from session.owner.
function petVariables(pet: PetInfo, entries: RecordEntry[], latestSummary?: Summary): Record<string, string> {
  const vars: Record<string, string> = {
    mode: 'care',
    pet_name: pet.name,
    species: pet.species,
  };
  if (pet.breed) vars.breed = pet.breed;
  if (pet.ageBucket || pet.age) vars.age_bucket = (pet.ageBucket || pet.age)!;
  if (pet.sexNeutered || pet.sex) vars.sex_neutered = (pet.sexNeutered || pet.sex)!;
  if (pet.weight) vars.weight = pet.weight;
  if (pet.conditions) vars.conditions = pet.conditions;
  if (pet.medications) vars.medications = pet.medications;

  if (latestSummary) {
    vars.current_concern = latestSummary.concern;
    vars.previous_summary = latestSummary.text.slice(0, 600);
  }

  const recentTimeline = entries
    .filter((e) => e.type !== 'reminder')
    .slice(0, 5)
    .map((e) => `${e.createdAt.slice(0, 10)}: ${entryLabel(e)}`)
    .join(' | ');
  if (recentTimeline) vars.recent_timeline = recentTimeline;

  const upcomingReminders = entries
    .filter((e): e is Extract<RecordEntry, { type: 'reminder' }> => e.type === 'reminder' && !e.done)
    .map((e) => `${e.title} (due ${e.due})`)
    .join(' | ');
  if (upcomingReminders) vars.reminders = upcomingReminders;

  const latestQol = entries.find((e): e is Extract<RecordEntry, { type: 'qol' }> => e.type === 'qol');
  if (latestQol) vars.wellness_signal = `${latestQol.score}/5 on ${latestQol.date}`;

  return vars;
}

function greetingFor(pet: PetInfo): string {
  return `Hi — I can help with ${pet.name}'s record, symptoms, reminders, or prepare a vet-ready summary. What would you like to do?`;
}

interface QuickAction {
  label: string;
  onClick: () => void;
}

interface LauncherProps {
  pet: PetInfo;
  entries: RecordEntry[];
  latestSummary?: Summary;
  onStartHealthCheck: () => void;
  onNavigate: (target: NavTarget) => void;
}

function CareAgentPanel({ pet, entries, latestSummary, onStartHealthCheck, onNavigate, onClose }: LauncherProps & { onClose: () => void }) {
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callMode, setCallMode] = useState<'text' | 'voice' | null>(null);
  const [draft, setDraft] = useState('');

  const conversation = useConversation({
    onMessage: (props) => {
      setTranscript((t) => [...t, { speaker: props.role === 'user' ? 'owner' : 'ai', text: stripVoiceTags(props.message) }]);
    },
    onError: (message) => {
      console.warn('[PAWai] Care Agent error:', message);
      setError("The conversation couldn't continue right now. Please try again in a moment.");
    },
    onDisconnect: (details) => {
      console.warn('[PAWai] Care Agent disconnected:', details);
      setCallMode(null);
      if (details.reason === 'user') return;
      const raw = details.reason === 'error' ? details.message : details.closeReason ?? '';
      setError(
        /quota|credit|limit/i.test(raw)
          ? "PAWai's Care Agent is resting for a moment. Please try again shortly."
          : "The conversation couldn't continue right now. Please try again."
      );
    },
  });

  // Never leave a live connection running once the panel is closed/unmounted.
  const endSessionRef = useRef(conversation.endSession);
  useEffect(() => { endSessionRef.current = conversation.endSession; }, [conversation.endSession]);
  useEffect(() => () => { endSessionRef.current(); }, []);

  const connected = conversation.status === 'connected' || conversation.status === 'connecting';
  const live = CARE_AGENT_LIVE && !!AGENT_ID;

  async function startText() {
    setError(null);
    if (!live) return;
    setCallMode('text');
    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
        dynamicVariables: petVariables(pet, entries, latestSummary),
        overrides: {
          conversation: { textOnly: true },
        },
      });
    } catch {
      setError('Could not start the text conversation. Please try again.');
      setCallMode(null);
    }
  }

  async function startVoice() {
    setError(null);
    if (!live) return;
    setCallMode('voice');
    try {
      const probeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      probeStream.getTracks().forEach((t) => t.stop());
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'webrtc',
        dynamicVariables: petVariables(pet, entries, latestSummary),
      });
    } catch {
      setError('Microphone access is needed for the voice conversation.');
      setCallMode(null);
    }
  }

  function endCall() {
    conversation.endSession();
    setCallMode(null);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    conversation.sendUserMessage(text);
    setTranscript((t) => [...t, { speaker: 'owner', text }]);
    setDraft('');
  }

  const quickActions: QuickAction[] = [
    { label: 'Start health check', onClick: () => { onClose(); onStartHealthCheck(); } },
    { label: 'Ask a care question', onClick: () => { if (live && !connected) startText(); } },
    { label: 'Update record', onClick: () => { onClose(); onNavigate('profile'); } },
    {
      label: 'Prepare vet summary',
      onClick: () => { onClose(); latestSummary ? onNavigate('summary') : onStartHealthCheck(); },
    },
    { label: 'Review timeline', onClick: () => { onClose(); onNavigate('timeline'); } },
  ];

  return (
    <div
      role="dialog"
      aria-label="PAWai Care Agent"
      style={{
        position: 'fixed', zIndex: 999,
        right: 0, left: 0, bottom: 0, top: 'auto', maxHeight: '85vh',
        margin: '0 auto', maxWidth: 420,
        background: 'var(--bg, #fff)', border: '1px solid var(--border)',
        borderRadius: '18px 18px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
        padding: '20px 20px 24px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--tx1)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span aria-hidden="true">💬</span> PAWai Care Agent
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--tx3)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      <p style={{ color: 'var(--tx2)', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
        {greetingFor(pet)}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {quickActions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={a.onClick}
            style={{ textAlign: 'left' }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {live ? (
        <>
          {!connected ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn--pri btn--sm" onClick={startText}>
                💬 Start text chat
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={startVoice}>
                🎙 Start voice call
              </button>
            </div>
          ) : (
            <>
              <div
                aria-live="polite"
                style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  maxHeight: 220, overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                  padding: '10px 12px', background: 'rgba(var(--bg-rgb), 0.5)',
                }}
              >
                {transcript.length === 0 ? (
                  <p style={{ color: 'var(--tx3)', fontSize: '0.85rem', margin: 0 }}>
                    {callMode === 'voice'
                      ? (conversation.isSpeaking ? 'PAWai is speaking…' : 'Listening…')
                      : 'Connecting…'}
                  </p>
                ) : (
                  transcript.map((m, i) => (
                    <div key={i} style={{ fontSize: '0.86rem', color: m.speaker === 'ai' ? 'var(--tx1)' : 'var(--tx2)' }}>
                      <strong>{m.speaker === 'ai' ? '🐾 PAWai' : 'You'}:</strong> {m.text}
                    </div>
                  ))
                )}
              </div>
              {callMode === 'text' && (
                <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Ask about ${pet.name}…`}
                    aria-label="Message"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn--pri btn--sm">Send</button>
                </form>
              )}
              <button type="button" className="btn btn--ghost btn--sm" onClick={endCall}>
                End conversation
              </button>
            </>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--tx3)', fontSize: '0.86rem', lineHeight: 1.6, margin: 0 }}>
          Free-form chat isn&apos;t live yet — it launches once it can genuinely use
          {' '}{pet.name}&apos;s profile. Meanwhile, the quick actions above still work today.
        </p>
      )}

      {error && (
        <p className="welcome-form__error" role="alert" style={{ margin: 0, fontSize: '0.82rem' }}>
          {error}
        </p>
      )}

      <p style={{ color: 'var(--tx3)', fontSize: '0.74rem', lineHeight: 1.5, margin: 0 }}>
        PAWai organizes information and never diagnoses — medical decisions belong to
        your veterinarian. Conversations, including the pet profile details you&apos;ve
        added, are processed by ElevenLabs to power PAWai&apos;s voice.
      </p>
    </div>
  );
}

export default function CareAgentLauncher(props: LauncherProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <ConversationProvider>
      <button
        type="button"
        aria-label="Open PAWai Care Agent"
        onClick={() => setOpen((v) => !v)}
        data-mag
        style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 1000,
          width: 58, height: 58, borderRadius: '50%',
          background: 'var(--teal, #0f766e)', color: '#fff', border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)', cursor: 'pointer',
          fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            aria-hidden="true"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', zIndex: 998 }}
          />
          <CareAgentPanel {...props} onClose={() => setOpen(false)} />
        </>
      )}
    </ConversationProvider>
  );
}
