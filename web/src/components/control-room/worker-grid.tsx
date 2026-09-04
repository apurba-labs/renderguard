import type { RenderWorker } from "@/lib/types";

import {
  Activity,
  Cpu,
  ShieldOff,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WorkerGridProps = {
  workers: RenderWorker[];
};

export function WorkerGrid({
  workers,
}: WorkerGridProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Render Farm
          </p>

          <h2 className="mt-1 text-lg font-semibold">
            GPU Workers
          </h2>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="size-4" />
          {workers.length} workers online
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workers.map((worker) => {
          const isDegraded =
            worker.status === "degraded";

          const isQuarantined =
            worker.status === "quarantined";

          return (
            <Card
              key={worker.worker_id}
              className={
                isDegraded
                  ? "border-destructive/50 bg-destructive/5 shadow-sm"
                  : isQuarantined
                    ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                    : "border-border/70 bg-card shadow-sm"
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isDegraded ? (
                      <TriangleAlert className="size-4 text-destructive" />
                    ) : isQuarantined ? (
                      <ShieldOff className="size-4 text-amber-600" />
                    ) : (
                      <Cpu className="size-4 text-muted-foreground" />
                    )}

                    <CardTitle className="font-mono text-sm font-medium">
                      {worker.worker_id}
                    </CardTitle>
                  </div>

                  <Badge
                    variant={
                      isDegraded
                        ? "destructive"
                        : "secondary"
                    }
                    className={
                      isQuarantined
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                        : undefined
                    }
                  >
                    {worker.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      VRAM
                    </p>

                    <p
                      className={
                        isDegraded
                          ? "mt-1 text-3xl font-semibold tracking-tight text-destructive"
                          : "mt-1 text-3xl font-semibold tracking-tight"
                      }
                    >
                      {worker.vram_used_percent}%
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Active chunks
                    </p>

                    <p className="mt-1 font-mono text-sm font-medium">
                      {worker.active_chunks}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={
                      isDegraded
                        ? "h-full rounded-full bg-destructive transition-[width] duration-700 ease-out"
                        : isQuarantined
                          ? "h-full rounded-full bg-amber-500 transition-[width] duration-700 ease-out"
                          : "h-full rounded-full bg-foreground/60 transition-[width] duration-700 ease-out"
                    }
                    style={{
                      width: `${Math.min(
                        worker.vram_used_percent,
                        100,
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex min-h-5 items-center">
                  {isDegraded ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <TriangleAlert className="size-3.5" />
                      Critical memory pressure
                    </p>
                  ) : isQuarantined ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                      <ShieldOff className="size-3.5" />
                      Removed from scheduling
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Rendering normally
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}