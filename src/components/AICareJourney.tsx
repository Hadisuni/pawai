'use client';

import { useEffect, useRef, useState } from 'react';
import PawAvatar from './care-journey/PawAvatar';
import PriorityBadge from './care-journey/PriorityBadge';
import FindingsPanel from './care-journey/FindingsPanel';
import TimelinePanel from './care-journey/TimelinePanel';
import SummaryCard from './care-journey/SummaryCard';
import { useSpeech } from '@/hooks/useSpeech';
import { loadSession, type PawSession } from '@/lib/session';
import {
  BRANCHES, getBranch, tierFromScore, personalize, DEFAULT_PET,
  type Branch, type Finding, type TimelineEvent, type StepOption, type Tier,
} from '@/lib/careJourney';

type Phase = 'greeting' | 'picker' | 'asking' | 'summary';
type Msg = { speaker: 'ai' | 'owner'; text: string };
type Speed = 1 | 1.5 | 2;

const greetingFor = (petName: string) =>
  `Hi, I'm PAWai. I'll ask a few questions to better understand what's happening with ${petName} before your veterinary visit. This usually takes about three minutes.`;
const pickerQuestionFor = (petName: string) => `First, what's going on with ${petName} today?`;
const TRANSITION_LINE = "Let's walk through another scenario.";

const STEP_DELAY = 3200;
const THINK_DELAY = 1100;
const LOOP_DELAY = 7000;

let uidCounter = 0;
const uid = () => `f${++uidCounter}`;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AICareJourney({ autoStart }: { autoStart?: boolean } = {}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<Phase>('greeting');
  const [branch, setBranch] = useState<Branch | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [transcript, setTranscript] = useState<Msg[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [points, setPoints] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [callSeconds, setCallSeconds] = useState(0);
  const [session, setSession] = useState<PawSession | null>(null);

  const petName = session?.pet.name || DEFAULT_PET;
  const patientLine = session
    ? `${session.pet.name} — ${session.pet.species}${session.pet.age ? ` — ${session.pet.age}` : ''}${session.pet.breed ? ` — ${session.pet.breed}` : ''}`
    : 'Max — Dog — 6 years — Neutered Male';

  const speech = useSpeech();
  const stageRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const autoPausedRef = useRef(false);
  const pausedRef = useRef(false);
  const speedRef = useRef<Speed>(1);
  const branchCycleRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<null | (() => void)>(null);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { startedRef.current = started; }, [started]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [transcript, thinking]);

  function clearAutoTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  function cancelPending() {
    clearAutoTimer();
    pendingRef.current = null;
  }

  function scheduleAutoAdvance(fn: () => void, delay = STEP_DELAY) {
    clearAutoTimer();
    pendingRef.current = fn;
    if (pausedRef.current) return;
    timerRef.current = setTimeout(() => {
      pendingRef.current = null;
      fn();
    }, delay / speedRef.current);
  }

  function togglePause() {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (!next && pendingRef.current) {
        const fn = pendingRef.current;
        timerRef.current = setTimeout(() => { pendingRef.current = null; fn(); }, 400);
      } else {
        clearAutoTimer();
      }
      return next;
    });
  }

  function cycleSpeed() {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  }

  function appendAI(text: string, onEnd?: () => void) {
    const finalText = personalize(text, petName);
    setTranscript((t) => [...t, { speaker: 'ai', text: finalText }]);
    speech.speak(finalText, { rate: speed === 2 ? 1.3 : speed === 1.5 ? 1.15 : 1, onEnd });
  }

  function appendOwner(text: string) {
    setTranscript((t) => [...t, { speaker: 'owner', text: personalize(text, petName) }]);
  }

  function startGreeting() {
    cancelPending();
    setPhase('greeting');
    setTranscript([]);
    setFindings([]);
    setTimeline([]);
    setPoints(0);
    setPicks([]);
    setBranch(null);
    setStepIndex(-1);
    setAwaitingInput(false);
    setThinking(false);
    appendAI(greetingFor(petName), () => scheduleAutoAdvance(startPicker, 600));
  }

  function startPicker() {
    setPhase('picker');
    appendAI(pickerQuestionFor(petName), () => {
      setAwaitingInput(true);
      scheduleAutoAdvance(() => {
        const b = BRANCHES[branchCycleRef.current % BRANCHES.length];
        handlePickBranch(b);
      });
    });
  }

  function handlePickBranch(b: Branch) {
    cancelPending();
    branchCycleRef.current += 1;
    setAwaitingInput(false);
    setBranch(b);
    appendOwner(b.patientLine);
    setPhase('asking');
    setStepIndex(-1);
    appendAI(b.intro, () => scheduleAutoAdvance(() => goToStep(b, 0), 900));
  }

  function goToStep(b: Branch, idx: number) {
    setThinking(false);
    setStepIndex(idx);
    const step = b.steps[idx];
    appendAI(step.question, () => {
      setAwaitingInput(true);
      scheduleAutoAdvance(() => {
        const opt = step.options[Math.floor(Math.random() * step.options.length)];
        handleChoose(b, idx, opt);
      });
    });
  }

  function handleChoose(b: Branch, idx: number, opt: StepOption) {
    cancelPending();
    setAwaitingInput(false);
    appendOwner(opt.label);
    setPicks((p) => { const next = [...p]; next[idx] = opt.label; return next; });
    setPoints((pt) => pt + opt.points);
    if (opt.finding) setFindings((f) => [...f, { id: uid(), ...opt.finding! }]);
    if (opt.timeline) setTimeline((tl) => [...tl, { id: uid(), ...opt.timeline! }]);
    setThinking(true);

    const next = idx + 1;
    if (next < b.steps.length) {
      scheduleAutoAdvance(() => goToStep(b, next), THINK_DELAY);
    } else {
      scheduleAutoAdvance(finishBranch, THINK_DELAY);
    }
  }

  function finishBranch() {
    setThinking(false);
    setPhase('summary');
    scheduleAutoAdvance(loopToNextBranch, LOOP_DELAY);
  }

  function loopToNextBranch() {
    setPhase('picker');
    setTranscript([]);
    setFindings([]);
    setTimeline([]);
    setPoints(0);
    setPicks([]);
    setBranch(null);
    setStepIndex(-1);
    appendAI(TRANSITION_LINE, () => {
      scheduleAutoAdvance(() => {
        const b = BRANCHES[branchCycleRef.current % BRANCHES.length];
        handlePickBranch(b);
      }, 900);
    });
  }

  function handleReplay() {
    cancelPending();
    speech.cancel();
    branchCycleRef.current = 0;
    setCallSeconds(0);
    setPaused(false);
    pausedRef.current = false;
    startGreeting();
  }

  function handleStart() {
    if (startedRef.current) return;
    setStarted(true);
    startedRef.current = true;
    startGreeting();
  }

  useEffect(() => {
    const loadedSession = loadSession();
    if (loadedSession) setSession(loadedSession);
    const activePetName = loadedSession?.pet.name || DEFAULT_PET;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setReducedMotion(true);
      setStarted(true);
      const b = getBranch('vomiting')!;
      setBranch(b);
      setPhase('summary');
      setTranscript([
        { speaker: 'owner', text: personalize(b.patientLine, activePetName) },
        { speaker: 'ai', text: personalize(b.intro, activePetName) },
        ...b.steps.flatMap((s) => [{ speaker: 'ai' as const, text: personalize(s.question, activePetName) }, { speaker: 'owner' as const, text: s.options[0].label }]),
      ]);
      const allFindings: Finding[] = [];
      const allTimeline: TimelineEvent[] = [];
      let pts = 0;
      const allPicks: string[] = [];
      b.steps.forEach((s) => {
        const opt = s.options[0];
        allPicks.push(opt.label);
        pts += opt.points;
        if (opt.finding) allFindings.push({ id: uid(), ...opt.finding });
        if (opt.timeline) allTimeline.push({ id: uid(), ...opt.timeline });
      });
      setFindings(allFindings);
      setTimeline(allTimeline);
      setPoints(pts);
      setPicks(allPicks);
      return;
    }

    if (autoStart) handleStart();

    const callTimer = setInterval(() => {
      if (startedRef.current) setCallSeconds((s) => s + 1);
    }, 1000);

    function onVisibilityChange() {
      if (document.hidden) {
        if (!pausedRef.current) {
          autoPausedRef.current = true;
          pausedRef.current = true;
          setPaused(true);
          clearAutoTimer();
          speech.cancel();
        }
      } else if (autoPausedRef.current) {
        autoPausedRef.current = false;
        pausedRef.current = false;
        setPaused(false);
        if (pendingRef.current) {
          const fn = pendingRef.current;
          timerRef.current = setTimeout(() => { pendingRef.current = null; fn(); }, 400);
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(callTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelPending();
      speech.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tier: Tier = branch ? tierFromScore(points, branch.minTier) : 'routine';

  return (
    <div className="cj">
      <div className="cj__grid" ref={stageRef} data-r>
        <div className="cj__call">
          <div className="callcard">
            <div className="callcard__top">
              <span className="callcard__title">PAWai AI Assistant</span>
              <span className="callcard__live"><span className="callcard__live-dot" aria-hidden="true" />LIVE</span>
            </div>
            <div className={`callcard__stage${!started ? ' is-idle' : ''}`}>
              <PawAvatar speaking={speech.speaking} listening={awaitingInput} />
              {!started && !reducedMotion && (
                <button type="button" className="callcard__start" onClick={handleStart} data-mag>
                  ▶ Start the Conversation
                </button>
              )}
            </div>
            <div className="callcard__status">
              <span className="callcard__status-dot" aria-hidden="true" />
              {!started ? 'Tap to begin' : phase === 'summary' ? 'Wrapping up' : awaitingInput ? 'Your turn' : thinking ? 'Thinking…' : 'Connected'}
              {started && <span className="callcard__timer">{formatTime(callSeconds)}</span>}
            </div>
            <div className="callcard__controls">
              <button
                type="button"
                className="callcard__ctrl"
                onClick={speech.toggleMuted}
                aria-label={speech.muted ? 'Unmute PAWai voice' : 'Mute PAWai voice'}
                data-mag
              >
                {speech.muted ? '🔇' : '🔊'}
              </button>
              <button
                type="button"
                className="callcard__ctrl callcard__ctrl--end"
                onClick={handleReplay}
                aria-label="Restart the conversation"
                data-mag
              >
                ↻
              </button>
              <span className={`callcard__ctrl callcard__ctrl--mic${awaitingInput ? ' is-live' : ''}`} aria-hidden="true">
                🎙
              </span>
            </div>
          </div>
        </div>

        <div className="cj__convo">
          <div className="convo">
            <div className="convo__hd">Conversation</div>
            <div className="convo__feed" ref={feedRef} aria-live="polite">
              {transcript.map((m, i) => (
                <div key={i} className={`ch ${m.speaker === 'ai' ? 'ch--ai' : 'ch--me'}`}>
                  {m.speaker === 'ai' && <div className="ch__tag">🐾 PAWai</div>}
                  {m.text}
                </div>
              ))}
              {thinking && (
                <div className="demo__scan">
                  <span className="demo__scan-dot" aria-hidden="true" />
                  PAWai is thinking…
                </div>
              )}
              {!started && !reducedMotion && (
                <p className="convo__empty">Tap &ldquo;Start the Conversation&rdquo; to begin the live intake call.</p>
              )}
            </div>

            {!reducedMotion && phase === 'picker' && awaitingInput && (
              <div className="convo__choices" role="group" aria-label={pickerQuestionFor(petName)}>
                {BRANCHES.map((b) => (
                  <button key={b.id} type="button" className="chip-btn" onClick={() => handlePickBranch(b)} data-mag>
                    <span aria-hidden="true">{b.icon}</span> {b.label}
                  </button>
                ))}
              </div>
            )}

            {!reducedMotion && phase === 'asking' && awaitingInput && branch && stepIndex >= 0 && (
              <div className="convo__choices" role="group" aria-label={branch.steps[stepIndex].question}>
                {branch.steps[stepIndex].options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className="chip-btn"
                    onClick={() => handleChoose(branch, stepIndex, opt)}
                    data-mag
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="cj__side">
          {branch && <PriorityBadge tier={tier} />}
          <FindingsPanel findings={findings} active={phase === 'asking'} />
          <TimelinePanel events={timeline} />
          {phase === 'summary' && branch && <SummaryCard branch={branch} picks={picks} tier={tier} patientLine={patientLine} petName={petName} />}
        </div>
      </div>

      {!reducedMotion && started && (
        <div className="intake-controls">
          <button type="button" className="btn btn--ghost btn--sm" data-mag onClick={togglePause} aria-label={paused ? 'Resume demo' : 'Pause demo'}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button type="button" className="btn btn--ghost btn--sm" data-mag onClick={handleReplay} aria-label="Replay from the start">
            ↻ Replay
          </button>
          <button type="button" className="btn btn--ghost btn--sm" data-mag onClick={cycleSpeed} aria-label="Change playback speed">
            {speed}x
          </button>
        </div>
      )}
    </div>
  );
}
