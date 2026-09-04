import {
  Activity,
  ShieldCheck,
} from "lucide-react";

type ControlRoomHeaderProps = {
  loading: boolean;
  healthyCount: number;
  degradedCount: number;
  quarantinedCount: number;
};

export function ControlRoomHeader({
  loading,
  healthyCount,
  degradedCount,
  quarantinedCount,
}: ControlRoomHeaderProps) {
  const hasIncident =
    degradedCount > 0;

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>

            <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              RenderGuard
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Production Control Room
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Autonomous observability, incident investigation,
            policy-guarded remediation, and closed-loop verification
            for production render workloads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity className="size-3.5" />
              Pipeline
            </div>

            <p className="mt-1 text-sm font-medium">
              {loading
                ? "Connecting..."
                : [
                    `${healthyCount} healthy`,
                    degradedCount
                      ? `${degradedCount} degraded`
                      : null,
                    quarantinedCount
                      ? `${quarantinedCount} quarantined`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
          </div>

          <div className="hidden rounded-lg border bg-card px-4 py-3 sm:block">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Safety
            </div>

            <p className="mt-1 text-sm font-medium">
              {hasIncident
                ? "Guardrails active"
                : "Policy enforced"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}