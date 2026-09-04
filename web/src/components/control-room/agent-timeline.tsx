import {
  Check,
  Circle,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";

import type {
  AgentStage,
  RenderGuardAgentEvent,
} from "@/lib/renderguard-agent/types";

import type {
  AgentTimelineState,
} from "@/hooks/use-agent-investigation";

type AgentTimelineProps = {
  events: AgentTimelineState;
  running: boolean;
};

const stages: {
  id: AgentStage;
  label: string;
}[] = [
  { id: "observe", label: "Observe" },
  { id: "correlate", label: "Correlate" },
  { id: "decide", label: "Decide" },
  { id: "guard", label: "Guard" },
  { id: "act", label: "Act" },
  { id: "verify", label: "Verify" },
];

function StageIcon({
  event,
}: {
  event?: RenderGuardAgentEvent;
}) {
  if (!event) {
    return <Circle className="size-4 text-muted-foreground" />;
  }

  if (event.status === "running") {
    return (
      <LoaderCircle className="size-4 animate-spin" />
    );
  }

  if (event.status === "failed") {
    return <X className="size-4 text-destructive" />;
  }

  return <Check className="size-4" />;
}

export function AgentTimeline({
  events,
  running,
}: AgentTimelineProps) {
  const complete = events.complete;
  const verified =
    events.verify?.status === "success" &&
    complete?.status === "success";

  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-6">
        <p className="text-sm font-medium">
          RenderGuard Agent
        </p>

        <p className="text-sm text-muted-foreground">
          {running
            ? "Autonomous investigation in progress"
            : verified
              ? "Closed-loop investigation complete"
              : "Waiting for investigation"}
        </p>
      </div>

      <div className="space-y-5">
        {stages.map((stage) => {
          const event = events[stage.id];

          return (
            <div
              key={stage.id}
              className="flex gap-3"
            >
              <div className="pt-0.5">
                <StageIcon event={event} />
              </div>

              <div>
                <p className="text-sm font-medium">
                  {stage.label}
                </p>

                <p className="text-sm text-muted-foreground">
                  {event?.message ?? "Pending"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {verified && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />

            <span className="text-sm font-medium">
              Closed Loop Verified
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Remediation independently confirmed through
            observability.
          </p>
        </div>
      )}
    </section>
  );
}