'use client';

import { useEffect, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import PawAvatar from './care-journey/PawAvatar';
import PriorityBadge from './care-journey/PriorityBadge';
import FindingsPanel from './care-journey/FindingsPanel';
import TimelinePanel from './care-journey/TimelinePanel';
import { loadSession, type PawSession } from '@/lib/session';
import { AGENTS } from '@/lib/agents';
import type { Finding, TimelineEvent, Tier } from '@/lib/careJourney';

// The ElevenLabs agent is the conversation brain here — it decides what to
// ask, picks the next "Procedure," and drives the dialogue. Our job is just
// to visualize whatever it tells us via Client Tools (see exact tool/variable
// contract in the project notes). Direct visits to /demo with no onboarding
// session fall back to the Health agent so the page still works standalone.
function resolveAgentId(session: PawSession | null): string | undefined {
  if (session) return AGENTS[session.agentGroup]?.agentId;
  return AGENTS.health.agentId;
}

function buildDynamicVariables(session: PawSession | null): Record<string, string> | undefined {
  if (!session) return undefined;
  return {
    owner_name: session.ownerName,
    pet_name: session.pet.name,
    species: session.pet.species,
    breed: session.pet.breed || '',
    age: session.pet.age || '',
    sex: session.pet.sex || '',
    weight: session.pet.weight || '',
    selected_experience: session.selectedExperience,
    session_id: session.sessionId,
  };
}

interface VetSummary {
  patient: string;
  complaint: string;
  history: string[];
  action: string;
}

type Msg = { speaker: 'ai' | 'owner'; text: string };

function asTone(v: unknown): Finding['tone'] {
  return v === 'concern' || v === 'positive' ? v : 'detected';
}

function asTier(v: unknown): Tier | null {
  return v === 'routine' || v === 'sameday' || v === 'urgent' || v === 'emergency' ? v : null;
}

function LiveVoiceJourneyInner() {
  const [session, setSession] = useState<PawSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [tier, setTier] = useState<Tier>('routine');
  const [summary, setSummary] = useState<VetSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manuallyEnded, setManuallyEnded] = useState(false);
  const findingIdRef = useRef(0);
  const timelineIdRef = useRef(0);

  useEffect(() => {
    setSession(loadSession());
    setSessionChecked(true);
  }, []);

  const conversation = useConversation({
    clientTools: {
      update_finding: async (params) => {
        const p = params as Record<string, unknown>;
        findingIdRef.current += 1;
        setFindings((f) => [...f, {
          id: `f${findingIdRef.current}`,
          label: String(p.label ?? ''),
          detail: String(p.detail ?? ''),
          tone: asTone(p.tone),
        }]);
        return 'ok';
      },
      update_timeline: async (params) => {
        const p = params as Record<string, unknown>;
        timelineIdRef.current += 1;
        setTimeline((t) => [...t, { id: `t${timelineIdRef.current}`, time: String(p.time ?? ''), label: String(p.label ?? '') }]);
        return 'ok';
      },
      set_priority: async (params) => {
        const p = params as Record<string, unknown>;
        const next = asTier(p.tier);
        if (next) setTier(next);
        return 'ok';
      },
      show_summary: async (params) => {
        const p = params as Record<string, unknown>;
        setSummary({
          patient: String(p.patient ?? ''),
          complaint: String(p.complaint ?? ''),
          history: Array.isArray(p.history) ? p.history.map(String) : [],
          action: String(p.action ?? ''),
        });
        return 'ok';
      },
    },
    onMessage: (props) => {
      setTranscript((t) => [...t, { speaker: props.role === 'user' ? 'owner' : 'ai', text: props.message }]);
    },
    // Visitors only ever see calm, on-brand copy — never raw SDK text or
    // close codes. The full technical detail still goes to the console so
    // it's debuggable without exposing it on the page.
    onError: (message) => {
      console.warn('[PAWai] ElevenLabs conversation error:', message);
      setError("The voice conversation couldn't continue right now. Please try again in a moment, or use the text conversation instead.");
    },
    // Without this, a call ended by the agent/server (quota, max duration,
    // silence timeout, origin rejection, etc.) just silently drops back to
    // "Tap to begin" with zero clue why — onError alone only fires for
    // client-side errors, not server-initiated disconnects.
    onDisconnect: (details) => {
      console.warn('[PAWai] ElevenLabs conversation disconnected:', details);
      if (details.reason === 'user') return;
      const raw = details.reason === 'error' ? details.message : details.closeReason ?? '';
      setError(
        /quota|credit|limit/i.test(raw)
          ? "PAWai's voice companion is resting for a moment. Please try again shortly, or use the text conversation instead."
          : "The voice conversation couldn't continue right now. Please try again, or use the text conversation instead."
      );
    },
  });

  // Never let two agents run at once — tear down any live connection if this
  // component unmounts (e.g. the visitor navigates away mid-call). Stored in
  // a ref so the cleanup always calls the latest session, not a stale one
  // captured by an empty-dependency effect.
  const endSessionRef = useRef(conversation.endSession);
  endSessionRef.current = conversation.endSession;
  useEffect(() => {
    return () => { endSessionRef.current(); };
  }, []);

  const agentId = resolveAgentId(session);

  async function handleStart() {
    setError(null);
    setManuallyEnded(false);
    if (!agentId) {
      setError('No voice agent is configured for this experience yet.');
      return;
    }
    try {
      // This is only to surface the permission prompt up front; the SDK opens
      // its own mic stream for the actual call. Release ours immediately so
      // we're not holding a second, orphaned, never-closed mic handle.
      const probeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      probeStream.getTracks().forEach((t) => t.stop());
      conversation.startSession({
        agentId,
        connectionType: 'webrtc',
        dynamicVariables: buildDynamicVariables(session),
      });
    } catch {
      setError('Microphone access is needed for the live voice conversation.');
    }
  }

  function handleEnd() {
    setManuallyEnded(true);
    conversation.endSession();
  }

  const started = !manuallyEnded && (conversation.status === 'connected' || conversation.status === 'connecting');

  return (
    <div className="cj">
      <div className="cj__grid" data-r>
        <div className="cj__call">
          <div className="callcard">
            <div className="callcard__top">
              <span className="callcard__title">PAWai AI Assistant</span>
              <span className="callcard__live"><span className="callcard__live-dot" aria-hidden="true" />LIVE</span>
            </div>
            <div className={`callcard__stage${!started ? ' is-idle' : ''}`}>
              <PawAvatar speaking={conversation.isSpeaking} listening={conversation.isListening} />
              {!started && (
                <button type="button" className="callcard__start" onClick={handleStart} data-mag disabled={!sessionChecked}>
                  🎙 Start Voice Conversation
                </button>
              )}
            </div>
            <div className="callcard__status">
              <span className="callcard__status-dot" aria-hidden="true" />
              {conversation.status === 'connected'
                ? (conversation.isSpeaking ? 'Speaking' : 'Listening')
                : conversation.status === 'connecting' ? 'Connecting…' : 'Tap to begin'}
            </div>
            {started && (
              <div className="callcard__controls">
                <button
                  type="button"
                  className="callcard__ctrl callcard__ctrl--end"
                  onClick={handleEnd}
                  aria-label="End the conversation"
                  data-mag
                >
                  ↻
                </button>
              </div>
            )}
          </div>
          {error && <p className="welcome-form__error" style={{ marginTop: 14 }}>{error}</p>}
        </div>

        <div className="cj__convo">
          <div className="convo">
            <div className="convo__hd">Conversation</div>
            <div className="convo__feed" aria-live="polite">
              {transcript.map((m, i) => (
                <div key={i} className={`ch ${m.speaker === 'ai' ? 'ch--ai' : 'ch--me'}`}>
                  {m.speaker === 'ai' && <div className="ch__tag">🐾 PAWai</div>}
                  {m.text}
                </div>
              ))}
              {!started && (
                <p className="convo__empty">
                  {session
                    ? `Tap "Start Voice Conversation" and allow microphone access — PAWai already knows about ${session.pet.name}.`
                    : 'Tap "Start Voice Conversation" and allow microphone access to begin.'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="cj__side">
          <PriorityBadge tier={tier} />
          <FindingsPanel findings={findings} active={started} />
          <TimelinePanel events={timeline} />
          {summary && (
            <div className="vsummary">
              <div className="vsummary__hd">✅ Vet-Ready Summary</div>
              <div className="vsummary__row"><span>Patient</span><p>{summary.patient}</p></div>
              <div className="vsummary__row"><span>Presenting Complaint</span><p>{summary.complaint}</p></div>
              <div className="vsummary__row">
                <span>History Summary</span>
                {summary.history.map((l, i) => <p key={i}>{l}</p>)}
              </div>
              <div className="vsummary__row vsummary__row--action"><span>Recommended Action</span><p>{summary.action}</p></div>
              <p className="vsummary__disclaimer">
                PAWai organizes information. PAWai does not diagnose. Final medical decisions are always made by licensed veterinarians.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveVoiceJourney() {
  return (
    <ConversationProvider>
      <LiveVoiceJourneyInner />
    </ConversationProvider>
  );
}
