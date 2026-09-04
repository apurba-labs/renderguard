import {
  Clapperboard,
  MonitorUp,
  Radio,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

export function RenderJob() {
  return (
    <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="p-6 lg:p-7">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Clapperboard className="size-4" />
              Final 4K Master
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Episode 07
                <span className="mx-2 text-muted-foreground/40">
                  /
                </span>
                Scene 047
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Final master rendering workload currently
                processing across the production GPU fleet.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="size-3.5" />

              <span>
                Production render in progress
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t bg-muted/20 lg:min-w-[360px] lg:border-l lg:border-t-0">
            <div className="flex flex-col justify-center border-r p-5 lg:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Profile
              </p>

              <p className="mt-2 text-sm font-semibold">
                4K MASTER
              </p>
            </div>

            <div className="flex flex-col justify-center p-5 lg:p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Resolution
              </p>

              <div className="mt-2 flex items-center gap-2 font-mono text-sm font-medium">
                <MonitorUp className="size-4 text-muted-foreground" />
                3840 × 2160
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}