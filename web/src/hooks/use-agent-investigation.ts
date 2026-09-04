"use client";

import { useCallback, useRef, useState } from "react";

import { runInvestigation } from "@/lib/renderguard-agent/client";

import type {
  AgentActivity,
  AgentStage,
  RenderGuardAgentEvent,
} from "@/lib/renderguard-agent/types";

export type AgentTimelineState = Partial<Record<AgentStage, RenderGuardAgentEvent>>;

export function useAgentInvestigation() {
  const [events, setEvents] = useState<AgentTimelineState>({});
  const [activity, setActivity] = useState<AgentActivity[]>([]);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const investigate = useCallback(async () => {
    if (running) {
      return;
    }

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setEvents({});
    setActivity([]);
    setError(null);
    setRunning(true);

    const sessionId = `incident-${crypto.randomUUID()}`;

    try {
      await runInvestigation({
        sessionId,
        signal: controller.signal,
        onEvent(event) {
          setEvents((current) => ({
            ...current,
            [event.stage]: event,
          }));
          
        },
        onActivity(next) {
          setActivity((current) => {
            const exists = current.some(
              (item) => item.id === next.id,
            );

            if (!exists) {
              return [...current, next];
            }

            return current.map((item) =>
              item.id === next.id
                ? next
                : item,
            );
          });
        },

      });
    } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") 
        {
            return;
        }

        setError(
            cause instanceof Error
            ? cause.message
            : "Agent investigation failed",
        );
    } finally {
      setRunning(false);
    }
  }, [running]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;

    setEvents({});
    setActivity([]);
    setError(null);
    setRunning(false);
  }, []);

  return {
    events,
    activity,
    running,
    error,
    investigate,
    reset,
  };
}