"use client";

import { AgentTimeline } from "@/components/control-room/agent-timeline";
import { IncidentPanel } from "@/components/control-room/incident-panel";
import { RenderJob } from "@/components/control-room/render-job";
import { WorkerGrid } from "@/components/control-room/worker-grid";
import { usePipelineStatus } from "@/hooks/use-pipeline-status";
import { useAgentInvestigation } from "@/hooks/use-agent-investigation";


export function ControlRoom() {
    const {
        workers,
        loading,
        error,
    } = usePipelineStatus();

    const healthyCount = workers.filter(
        (worker) => worker.status === "healthy",
    ).length;

    const degradedWorkers = workers.filter(
        (worker) => worker.status === "degraded",
    );
    const quarantinedCount = workers.filter(
        (worker) => worker.status === "quarantined",
    ).length;

    const {
        events,
        running: agentRunning,
        error: agentError,
        investigate,
    } = useAgentInvestigation();

    const hasAgentActivity = Object.keys(events).length > 0 || agentRunning;

    const activeIncident = degradedWorkers.length > 0 || hasAgentActivity;

    return (
        <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
            <header className="mb-8">
            <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-emerald-500" />

                <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                RenderGuard
                </span>
            </div>

            <div className="mt-5 flex items-end justify-between gap-6">
                <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                    Production Control Room
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    Autonomous render operations and incident response
                </p>
                </div>

                <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Pipeline
                </p>

                <p className="mt-1 text-sm font-medium">
                    {loading
                        ? "Connecting..."
                        : [
                            `${healthyCount} healthy`,
                            degradedWorkers.length
                            ? `${degradedWorkers.length} degraded`
                            : null,
                            quarantinedCount
                            ? `${quarantinedCount} quarantined`
                            : null,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                </p>
                </div>
            </div>
            </header>

            {error ? (
            <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Pipeline unavailable: {error}
            </div>
            ) : null}

            <div className="space-y-8">
            <RenderJob />

            <WorkerGrid workers={workers} />

                {activeIncident ? (
                <>
                    <IncidentPanel />

                    <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5">
                    <div>
                        <p className="text-sm font-medium">
                        RenderGuard Agent
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                        Investigate the incident and perform policy-guarded
                        remediation when supported by evidence.
                        </p>

                        {agentError ? (
                        <p className="mt-2 text-sm text-destructive">
                            {agentError}
                        </p>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        disabled={agentRunning}
                        onClick={investigate}
                        className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {agentRunning
                        ? "Investigating..."
                        : "Investigate & Resolve"}
                    </button>
                    </div>

                    <AgentTimeline
                    events={events}
                    running={agentRunning}
                    />
                </>
                ) : (
                <div className="rounded-xl border p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    RenderGuard Agent
                    </p>

                    <p className="mt-2 text-lg font-medium">
                    {quarantinedCount > 0
                        ? "Pipeline stabilized"
                        : "Pipeline nominal"}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                    {quarantinedCount > 0
                        ? `${quarantinedCount} worker ${
                            quarantinedCount === 1 ? "is" : "are"
                        } quarantined and removed from active scheduling.`
                        : "Monitoring telemetry for production incidents."}
                    </p>
                </div>
                )}
            </div>
        </div>
        </main>
    );
}