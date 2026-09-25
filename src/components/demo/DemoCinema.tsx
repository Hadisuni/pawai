'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { DEMO_STORIES, type CinemaStory } from '@/lib/demoCinema';
import StoryPicker from './StoryPicker';
import StoryStage, { type StageState } from './StoryStage';

type Speed = 1 | 1.5 | 2;

function emptyState(caption = ''): StageState {
  return {
    tier: 'routine',
    caption,
    history: [],
    findings: [],
    knowledge: null,
    plan: null,
    clinic: null,
    packetSend: false,
    showSummary: false,
  };
}

/** Apply beats [0..throughInclusive] cumulatively onto a fresh stage state. */
function stateThroughBeat(story: CinemaStory, throughInclusive: number): StageState {
  const next = emptyState();
  const end = Math.min(throughInclusive, story.beats.length - 1);
  for (let i = 0; i <= end; i++) {
    const beat = story.beats[i];
    if (beat.caption) next.caption = beat.caption;
    if (beat.tier) next.tier = beat.tier;
    if (beat.historyAdd?.length) {
      next.history = [...next.history, ...beat.historyAdd];
    }
    if (beat.findingsAdd?.length) {
      next.findings = [...next.findings, ...beat.findingsAdd];
    }
    if (beat.knowledge) next.knowledge = beat.knowledge;
    if (beat.plan) next.plan = beat.plan;
    if (beat.clinic) next.clinic = beat.clinic;
    if (beat.packetSend) next.packetSend = true;
    if (beat.showSummary) next.showSummary = true;
  }
  return next;
}

function fullStoryState(story: CinemaStory): StageState {
  return stateThroughBeat(story, story.beats.length - 1);
}

export default function DemoCinema() {
  const reduceMotion = usePrefersReducedMotion();
  const [storyIndex, setStoryIndex] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [started, setStarted] = useState(false);

  const pausedRef = useRef(false);
  const speedRef = useRef<Speed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<null | (() => void)>(null);
  const storyIndexRef = useRef(0);
  const beatIndexRef = useRef(0);

  const story = DEMO_STORIES[storyIndex];

  const state: StageState = useMemo(() => {
    if (!started && reduceMotion) return fullStoryState(story);
    if (!started) {
      return emptyState(`Press play to watch ${story.petName}'s care journey.`);
    }
    if (reduceMotion) return fullStoryState(story);
    return stateThroughBeat(story, beatIndex);
  }, [started, reduceMotion, story, beatIndex]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    storyIndexRef.current = storyIndex;
  }, [storyIndex]);
  useEffect(() => {
    beatIndexRef.current = beatIndex;
  }, [beatIndex]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (fn: () => void, delayMs: number) => {
      clearTimer();
      pendingRef.current = fn;
      if (pausedRef.current) return;
      timerRef.current = setTimeout(() => {
        pendingRef.current = null;
        fn();
      }, delayMs / speedRef.current);
    },
    [clearTimer],
  );

  const goToStory = useCallback(
    (index: number, autoPlay = true) => {
      clearTimer();
      pendingRef.current = null;
      const next = ((index % DEMO_STORIES.length) + DEMO_STORIES.length) % DEMO_STORIES.length;
      setStoryIndex(next);
      setBeatIndex(0);
      storyIndexRef.current = next;
      beatIndexRef.current = 0;
      if (autoPlay) {
        setStarted(true);
        setPaused(false);
        pausedRef.current = false;
      }
    },
    [clearTimer],
  );

  const advance = useCallback(() => {
    const s = DEMO_STORIES[storyIndexRef.current];
    const bi = beatIndexRef.current;
    if (bi >= s.beats.length - 1) {
      goToStory(storyIndexRef.current + 1, true);
      return;
    }
    const nextBeat = bi + 1;
    setBeatIndex(nextBeat);
    beatIndexRef.current = nextBeat;
  }, [goToStory]);

  // Auto-play beats when motion is allowed and the cinema has started.
  useEffect(() => {
    if (!started || reduceMotion || paused) {
      clearTimer();
      return;
    }
    const beat = story.beats[beatIndex];
    if (!beat) return;
    schedule(advance, beat.durationMs);
    return clearTimer;
  }, [started, reduceMotion, paused, story, beatIndex, schedule, advance, clearTimer]);

  // Reduced-motion: once started, auto-rotate full stories on a calm interval.
  useEffect(() => {
    if (!started || !reduceMotion || paused) {
      clearTimer();
      return;
    }
    schedule(() => goToStory(storyIndexRef.current + 1, true), 9000);
    return clearTimer;
  }, [started, reduceMotion, paused, storyIndex, schedule, goToStory, clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  function togglePause() {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (!next && pendingRef.current) {
        const fn = pendingRef.current;
        timerRef.current = setTimeout(() => {
          pendingRef.current = null;
          fn();
        }, 350);
      } else {
        clearTimer();
      }
      return next;
    });
  }

  function handlePlay() {
    setStarted(true);
    setPaused(false);
    pausedRef.current = false;
    setBeatIndex(0);
    beatIndexRef.current = 0;
  }

  function selectStory(id: CinemaStory['id']) {
    const idx = DEMO_STORIES.findIndex((s) => s.id === id);
    if (idx < 0) return;
    goToStory(idx, started || reduceMotion);
  }

  function prevStory() {
    goToStory(storyIndexRef.current - 1, started);
  }

  function nextStory() {
    goToStory(storyIndexRef.current + 1, started);
  }

  function cycleSpeed() {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  }

  return (
    <div className="cinema" data-r>
      <StoryPicker stories={DEMO_STORIES} activeId={story.id} onSelect={selectStory} />

      <StoryStage story={story} state={state} reduceMotion={reduceMotion} />

      <div className="cinema-controls" role="group" aria-label="Demo playback controls">
        {!started ? (
          <button type="button" className="btn btn--pri btn--lg" data-mag onClick={handlePlay}>
            ▶ Play cinema demo
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              data-mag
              onClick={prevStory}
              aria-label="Previous story"
            >
              ← Prev
            </button>
            {!reduceMotion && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                data-mag
                onClick={togglePause}
                aria-label={paused ? 'Resume demo' : 'Pause demo'}
              >
                {paused ? '▶ Resume' : '❚❚ Pause'}
              </button>
            )}
            {!reduceMotion && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                data-mag
                onClick={cycleSpeed}
                aria-label={`Playback speed ${speed}x`}
              >
                {speed}×
              </button>
            )}
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              data-mag
              onClick={nextStory}
              aria-label="Next story"
            >
              Next →
            </button>
          </>
        )}
      </div>

      <p className="cinema-note">
        {reduceMotion
          ? 'Reduced motion is on — full story content is shown without motion loops. Use Prev / Next to switch pets.'
          : 'Three stories rotate after each clinic packet. Pause, change speed, or jump tabs anytime.'}
      </p>
    </div>
  );
}
