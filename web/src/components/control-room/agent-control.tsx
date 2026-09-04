import {
  Bot,
  Play,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type AgentControlProps = {
  running: boolean;
  verified: boolean;
  remediationStarted: boolean;
  error: string | null;
  mode: string;
  onInvestigate: () => void;
};

export function AgentControl({
  running,
  verified,
  remediationStarted,
  error,
  mode,
  onInvestigate,
}: AgentControlProps) {
  return (
    <section className="rounded-xl border bg-card p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
            <Bot className="size-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">
                RenderGuard Agent
              </h2>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Policy guarded
              </div>
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Investigate production telemetry, correlate
              evidence, and perform remediation only when
              deterministic policy permits the action.
            </p>

            {error ? (
              <p className="mt-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {process.env.NODE_ENV === "development" ? (
            <span className="text-xs text-muted-foreground">
              Agent: {mode}
            </span>
          ) : null}

          <Button
          type="button"
          disabled={
            running ||
            remediationStarted ||
            verified
          }
          onClick={onInvestigate}
          className="min-w-[190px]"
        >
          {verified ? (
            <>
              <ShieldCheck className="size-4" />
              Remediation Verified
            </>
          ) : remediationStarted ? (
            <>
              <span className="size-2 animate-pulse rounded-full bg-current" />
              Verifying Remediation...
            </>
          ) : running ? (
            <>
              <span className="size-2 animate-pulse rounded-full bg-current" />
              Investigating...
            </>
          ) : (
            <>
              <Play className="size-4" />
              Investigate & Resolve
            </>
          )}
        </Button>
        </div>
      </div>
    </section>
  );
}