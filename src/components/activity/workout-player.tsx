"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import type { Workout } from "@/lib/activity/queries";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type Cue = {
  name: string;
  duration: number;
  is_rest: boolean;
  round: number;
  prep: boolean;
};

const PREP_SECONDS = 10;

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function WorkoutPlayer({
  workout,
  onClose,
}: {
  workout: Workout;
  onClose: () => void;
}) {
  const t = useT();
  const cues = useMemo<Cue[]>(() => {
    const list: Cue[] = [];
    if (workout.steps.length === 0) return list;
    list.push({
      name: t("activity.getReady"),
      duration: PREP_SECONDS,
      is_rest: true,
      round: 0,
      prep: true,
    });
    for (let r = 1; r <= workout.rounds; r++) {
      for (const s of workout.steps) {
        list.push({
          name: s.name,
          duration: s.duration_seconds,
          is_rest: s.is_rest,
          round: r,
          prep: false,
        });
      }
    }
    return list;
  }, [workout, t]);

  const [idx, setIdxState] = useState(0);
  const [secondsLeft, setSecState] = useState(cues[0]?.duration ?? 0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(cues.length === 0);

  // Refs mirror idx/secondsLeft so the interval callback reads current values.
  const idxRef = useRef(0);
  const secsRef = useRef(cues[0]?.duration ?? 0);
  const setIndex = (v: number) => {
    idxRef.current = v;
    setIdxState(v);
  };
  const setSecs = (v: number) => {
    secsRef.current = v;
    setSecState(v);
  };

  const audioRef = useRef<AudioContext | null>(null);
  const beep = useCallback((freq: number, ms: number) => {
    try {
      if (!audioRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctx) return;
        audioRef.current = new Ctx();
      }
      const ctx = audioRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      o.start();
      o.stop(ctx.currentTime + ms / 1000);
    } catch {
      /* audio is best-effort */
    }
  }, []);

  // Single timer: ticks down, auto-advances, and chimes. setState runs inside
  // the interval callback (an async event), not synchronously in the effect.
  useEffect(() => {
    if (paused || done) return;
    const t = setInterval(() => {
      const s = secsRef.current;
      if (s > 1) {
        secsRef.current = s - 1;
        setSecState(s - 1);
        if (s - 1 <= 3) beep(440, 120);
        return;
      }
      const next = idxRef.current + 1;
      if (next >= cues.length) {
        setDone(true);
        beep(880, 420);
      } else {
        idxRef.current = next;
        setIdxState(next);
        secsRef.current = cues[next].duration;
        setSecState(cues[next].duration);
        if (!cues[next].prep) beep(660, 180);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [paused, done, cues, beep]);

  // keep the screen awake during a workout (best-effort)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    (async () => {
      try {
        const wl = (
          navigator as unknown as {
            wakeLock?: {
              request: (t: string) => Promise<{ release: () => Promise<void> }>;
            };
          }
        ).wakeLock;
        lock = (await wl?.request("screen")) ?? null;
      } catch {
        /* not supported */
      }
    })();
    return () => {
      try {
        lock?.release();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const totalSeconds = useMemo(
    () =>
      workout.steps.reduce((s, x) => s + x.duration_seconds, 0) *
      workout.rounds,
    [workout],
  );

  const goPrev = () => {
    const p = Math.max(0, idx - 1);
    setIndex(p);
    setSecs(cues[p].duration);
    setDone(false);
  };
  const goNext = () => {
    const n = idx + 1;
    if (n >= cues.length) {
      setDone(true);
    } else {
      setIndex(n);
      setSecs(cues[n].duration);
      beep(660, 150);
    }
  };
  const restart = () => {
    setIndex(0);
    setSecs(cues[0]?.duration ?? 0);
    setDone(false);
    setPaused(false);
  };

  if (cues.length === 0) {
    return (
      <Shell rest>
        <p className="text-lg">{t("activity.noMovesYet")}</p>
        <PillButton onClick={onClose}>{t("activity.close")}</PillButton>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell rest>
        <span className="flex size-20 items-center justify-center rounded-full bg-white/15">
          <Check className="size-10" />
        </span>
        <h2 className="font-heading text-3xl font-semibold">
          {t("activity.niceWork")}
        </h2>
        <p className="text-white/80">
          {workout.name} · {fmt(totalSeconds)} ·{" "}
          {workout.rounds === 1
            ? t("activity.roundCount", { count: workout.rounds })
            : t("activity.roundsCount", { count: workout.rounds })}
        </p>
        <div className="flex gap-3">
          <PillButton onClick={restart}>{t("activity.again")}</PillButton>
          <PillButton onClick={onClose} solid>
            {t("activity.done")}
          </PillButton>
        </div>
      </Shell>
    );
  }

  const cur = cues[idx];
  const next = cues[idx + 1];
  const progress = cur.duration > 0 ? 1 - secondsLeft / cur.duration : 0;
  const R = 130;
  const CIRC = 2 * Math.PI * R;

  return (
    <Shell rest={cur.is_rest}>
      {/* top row */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="text-sm font-medium text-white/80">
          {cur.prep
            ? workout.name
            : t("activity.roundProgress", {
                round: cur.round,
                total: workout.rounds,
              })}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("activity.stopWorkout")}
          className="inline-flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* timer ring */}
      <div className="relative flex size-72 items-center justify-center">
        <svg viewBox="0 0 300 300" className="size-72 -rotate-90">
          <circle
            cx="150"
            cy="150"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-white/20"
          />
          <circle
            cx="150"
            cy="150"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className="text-white transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * progress}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-6xl font-semibold tabular-nums">
            {fmt(secondsLeft)}
          </span>
          {cur.is_rest && !cur.prep && (
            <span className="mt-1 text-sm uppercase tracking-widest text-white/70">
              {t("activity.rest")}
            </span>
          )}
        </div>
      </div>

      {/* current move */}
      <h2 className="max-w-xs font-heading text-3xl font-semibold leading-tight">
        {cur.name}
      </h2>
      <p className="-mt-2 h-5 text-sm text-white/70">
        {next ? t("activity.next", { name: next.name }) : t("activity.lastMove")}
      </p>

      {/* controls */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={goPrev}
          aria-label={t("activity.previous")}
          className="inline-flex size-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
        >
          <SkipBack className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t("activity.resume") : t("activity.pause")}
          className="inline-flex size-16 items-center justify-center rounded-full bg-white text-foreground shadow-lg active:translate-y-px"
        >
          {paused ? (
            <Play className="size-7 translate-x-0.5 fill-current" />
          ) : (
            <Pause className="size-7 fill-current" />
          )}
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label={t("activity.skip")}
          className="inline-flex size-12 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
        >
          <SkipForward className="size-6" />
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children, rest }: { children: ReactNode; rest?: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 px-6 text-center text-white",
        rest
          ? "bg-gradient-to-b from-[#3c5663] to-[#26323a]"
          : "bg-gradient-to-b from-[#5d7551] to-[#2c402a]",
      )}
    >
      {children}
    </div>
  );
}

function PillButton({
  children,
  onClick,
  solid,
}: {
  children: ReactNode;
  onClick: () => void;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
        solid
          ? "bg-white text-foreground hover:bg-white/90"
          : "bg-white/15 text-white hover:bg-white/25",
      )}
    >
      {children}
    </button>
  );
}
