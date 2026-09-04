import { Clapperboard, MonitorUp } from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

export function RenderJob() {
  return (
    <Card className="bg-card/60">
      <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Clapperboard className="size-4" />
            Current Render Job
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Episode 07 / Scene 047
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Final master rendering workload
          </p>
        </div>

        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Profile
            </p>
            <p className="mt-1 font-medium">
              4K Master
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Resolution
            </p>

            <div className="mt-1 flex items-center gap-2 font-mono text-sm">
              <MonitorUp className="size-4 text-muted-foreground" />
              3840 × 2160
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}