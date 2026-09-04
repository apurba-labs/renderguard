import {
  AlertTriangle,
  Cpu,
  Film,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type IncidentPanelProps = {
  verified: boolean;
};

export function IncidentPanel({ verified }: IncidentPanelProps) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
            className={`text-xs font-medium uppercase tracking-[0.2em] ${
              verified
                ? "text-emerald-700"
                : "text-destructive"
            }`}
          >
            {verified
              ? "Remediated Incident"
              : "Active Incident"}
          </p>

            <CardTitle className="mt-2 flex items-center gap-2 text-xl">
              <AlertTriangle className="size-5 text-destructive" />
              GPU Memory Pressure
            </CardTitle>
          </div>

          <Badge variant="destructive">
            Critical
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Production Context
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <Film className="size-4 text-muted-foreground" />
              Scene 047 · Segment 12
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Affected Worker
            </p>

            <div className="mt-2 flex items-center gap-2 font-mono text-sm">
              <Cpu className="size-4 text-muted-foreground" />
              render-gpu-03
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Failure
            </p>

            <p className="mt-2 font-mono text-sm text-destructive">
              CUDA_OUT_OF_MEMORY
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-destructive/20 bg-background/60 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Evidence
          </p>

          <p className="mt-2 text-sm">
            GPU VRAM reached{" "}
            <span className="font-semibold text-destructive">
              97%
            </span>{" "}
            while processing Segment 12.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}