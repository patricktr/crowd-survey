"use client";

import { useEffect, useState } from "react";

type Options = {
  intervalMs?: number;
  idleAfterMs?: number;
};

export function useActivePolling<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  initial: T,
  options: Options = {}
): { data: T; refresh: () => Promise<void>; isActive: boolean } {
  const { intervalMs = 60_000, idleAfterMs = 5 * 60_000 } = options;
  const [data, setData] = useState<T>(initial);
  const [isActive, setIsActive] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = async () => {
    setRefreshTick((t) => t + 1);
  };

  useEffect(() => {
    let cancelled = false;
    let inflight: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastActivity = Date.now();

    const computeActive = () => {
      const visible = !document.hidden;
      const idle = Date.now() - lastActivity > idleAfterMs;
      return visible && !idle;
    };

    const doFetch = async () => {
      inflight?.abort();
      const controller = new AbortController();
      inflight = controller;
      try {
        const next = await fetcher(controller.signal);
        if (!cancelled && !controller.signal.aborted) setData(next);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("[polling] fetch failed", err);
        }
      }
    };

    const scheduleNext = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        if (cancelled) return;
        const active = computeActive();
        setIsActive(active);
        if (active) await doFetch();
        scheduleNext();
      }, intervalMs);
    };

    const onActivity = () => {
      const wasIdle = Date.now() - lastActivity > idleAfterMs;
      lastActivity = Date.now();
      if (wasIdle && !document.hidden) {
        setIsActive(true);
        void doFetch();
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        setIsActive(false);
      } else {
        lastActivity = Date.now();
        setIsActive(true);
        void doFetch();
      }
    };

    const activityEvents: (keyof DocumentEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];
    for (const ev of activityEvents) {
      document.addEventListener(ev, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    if (refreshTick > 0) void doFetch();
    scheduleNext();

    return () => {
      cancelled = true;
      for (const ev of activityEvents) {
        document.removeEventListener(ev, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) clearTimeout(timer);
      inflight?.abort();
    };
  }, [fetcher, intervalMs, idleAfterMs, refreshTick]);

  return { data, refresh, isActive };
}
