
import type { RenderWorker } from "@/lib/types";
import {
  Activity,
  Cpu,
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

export function WorkerGrid({workers}: WorkerGridProps) {

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
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

          const isDegraded = worker.status === "degraded";
          const isQuarantined = worker.status === "quarantined";


          return (
            <Card
            key={worker.worker_id}
            className={
                isDegraded
                ? "border-destructive/50 bg-destructive/5"
                : isQuarantined
                    ? "border-amber-500/40 bg-amber-500/5"
                    : "bg-card/60"
            }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {isDegraded ? (
                        <TriangleAlert className="size-4 text-destructive" />
                        ) : isQuarantined ? (
                        <TriangleAlert className="size-4 text-amber-600" />
                        ) : (
                        <Cpu className="size-4 text-muted-foreground" />
                        )}

                        <CardTitle className="text-sm">
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
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      VRAM
                    </p>

                    <p className="mt-1 text-3xl font-semibold tracking-tight">
                      {worker.vram_used_percent}%
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Active chunks
                    </p>

                    <p className="mt-1 font-mono text-sm">
                      {worker.active_chunks}
                    </p>
                  </div>
                </div>

                <div
                className={
                    isDegraded
                    ? "h-full rounded-full bg-destructive transition-all duration-500"
                    : isQuarantined
                        ? "h-full rounded-full bg-amber-500 transition-all duration-500"
                        : "h-full rounded-full bg-foreground/70 transition-all duration-500"
                }
                style={{
                    width: `${worker.vram_used_percent}%`,
                }}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}