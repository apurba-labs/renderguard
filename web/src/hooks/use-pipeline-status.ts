"use client";

import { useEffect, useState } from "react";

import { getPipelineStatus } from "@/lib/api";
import type { RenderWorker } from "@/lib/types";

const POLL_INTERVAL_MS = 2000;

export function usePipelineStatus() {
  const [workers, setWorkers] = useState<RenderWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;

    async function refresh() {
      controller?.abort();
      controller = new AbortController();

      try {
        const data = await getPipelineStatus(
          controller.signal,
        );

        if (!mounted) {
          return;
        }

        setWorkers(data);
        setError(null);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        if (!mounted) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load pipeline status",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    refresh();

    const interval = window.setInterval(
      refresh,
      POLL_INTERVAL_MS,
    );

    return () => {
      mounted = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, []);

  return {
    workers,
    loading,
    error,
  };
}