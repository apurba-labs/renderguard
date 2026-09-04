"use client";

import {
  Activity,
  Check,
  LoaderCircle,
  X,
} from "lucide-react";

import type {AgentActivity} from "@/lib/renderguard-agent/types";

type LiveAgentActivityProps = {
  activity: AgentActivity[];
  running: boolean;
};

function ActivityIcon({
  status,
}: {
  status: AgentActivity["status"];
}) {
  if (status === "running") {
    return (
      <LoaderCircle className="h-4 w-4 animate-spin" />
    );
  }

  if (status === "failed") {
    return <X className="h-4 w-4" />;
  }

  return <Check className="h-4 w-4" />;
}


export function LiveAgentActivity({
  activity,
  running,
}: LiveAgentActivityProps) {
  if (activity.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />

          <div>
            <h3 className="text-sm font-semibold">
              Live Agent Activity
            </h3>

            <p className="text-xs text-muted-foreground">
              Real-time autonomous execution trace
            </p>
          </div>
        </div>

        {running && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>

            Live
          </div>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto">
        {activity.map((event) => (
          <div
            key={event.id}
            className="flex gap-3 border-b px-5 py-3 last:border-b-0"
          >
            <div className="mt-0.5 text-muted-foreground">
              <ActivityIcon status={event.status} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                {event.source}
              </span>

              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {event.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {event.message}
            </p>

          </div>
        ))}
      </div>
    </section>
  );
}