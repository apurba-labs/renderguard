"use client";

import { useCallback, useRef, useState } from "react";

import { runInvestigation } from "@/lib/renderguard-agent/client";
import type {
  AgentStage,
  RenderGuardAgentEvent,
} from "@/lib/renderguard-agent/types";

export type AgentTimelineState = Partial<Record<AgentStage, RenderGuardAgentEvent>>;

export function useAgentInvestigation() {
  const [events, setEvents] = useState<AgentTimelineState>({});

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
    setError(null);
    setRunning(false);
  }, []);

  return {
    events,
    running,
    error,
    investigate,
    reset,
  };
}