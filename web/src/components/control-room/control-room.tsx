"use client";

import { ControlRoomHeader } from "@/components/control-room/control-room-header";
import { IncidentPanel } from "@/components/control-room/incident-panel";
import { AgentControl } from "@/components/control-room/agent-control";
import { AgentTimeline } from "@/components/control-room/agent-timeline";
import { RenderJob } from "@/components/control-room/render-job";
import { WorkerGrid } from "@/components/control-room/worker-grid";
import { usePipelineStatus } from "@/hooks/use-pipeline-status";
import { useAgentInvestigation } from "@/hooks/use-agent-investigation";
import { LiveAgentActivity } from "@/components/control-room/live-agent-activity";
import { SimulationControls } from "@/components/control-room/simulation-controls";

export function ControlRoom() {

    const agentMode = process.env.NEXT_PUBLIC_RENDERGUARD_AGENT_MODE ?? "real";

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
        activity,
        running: agentRunning,
        error: agentError,
        investigate,
        reset,
    } = useAgentInvestigation();

    const hasAgentActivity = Object.keys(events).length > 0 || agentRunning;

    const activeIncident = degradedWorkers.length > 0 || hasAgentActivity;

    const remediationVerified = events.verify?.status === "success" && events.complete?.status === "success";

    const remediationInProgress = agentRunning || events.act?.status === "success";

    return (
        <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">

            <ControlRoomHeader
            loading={loading}
            healthyCount={healthyCount}
            degradedCount={degradedWorkers.length}
            quarantinedCount={quarantinedCount}
            />

            {error ? (
            <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Pipeline unavailable: {error}
            </div>
            ) : null}

            <div className="space-y-8">

            <div className="flex justify-end">
                <SimulationControls  
                canStartIncident={
                    degradedWorkers.length === 0 &&
                    quarantinedCount === 0
                }
                canReset={!agentRunning && Object.keys(events).length > 0}
                onReset={reset} 
                />
            </div>

            <RenderJob />

            <WorkerGrid workers={workers} />

                {activeIncident ? (
                <>
                    <IncidentPanel verified={remediationVerified}/>

                    <AgentControl
                    running={agentRunning}
                    verified={remediationVerified}
                    remediationStarted={remediationInProgress}
                    error={agentError}
                    mode={agentMode}
                    onInvestigate={investigate}
                    />

                    <AgentTimeline
                    events={events}
                    running={agentRunning}
                    />

                    <LiveAgentActivity
                    activity={activity}
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