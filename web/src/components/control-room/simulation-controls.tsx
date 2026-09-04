"use client";

import {
  CirclePlay,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type SimulationControlsProps = {
    canStartIncident: boolean;
    canReset: boolean;
    onReset?: () => void;
};

const API_URL =
  process.env.NEXT_PUBLIC_RENDERGUARD_API_URL ??
  "http://127.0.0.1:8000";

export function SimulationControls({
  canStartIncident,
    canReset,
    onReset,
}: SimulationControlsProps) {
    async function startIncident() {
        const response = await fetch(
            `${API_URL}/simulation/failures/vram-leak`,
            {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                worker_id: "render-gpu-03",
            }),
            },
        );

        if (!response.ok) {
            const body = await response.text();

            console.error(
                "Failed to start incident:",
                response.status,
                body,
            );

            return;
        }
    }

    async function resetEpisode() {
        const response = await fetch(
            `${API_URL}/simulation/reset`,
            {
            method: "POST",
            },
        );

        if (!response.ok) {
            throw new Error("Failed to reset episode");
        }

        onReset?.();
    }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card/70 p-1.5 shadow-sm">
        <span className="hidden px-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground md:inline">
            Simulation
        </span>

        <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canStartIncident}
        onClick={startIncident}
        className="gap-2"
        >
        <CirclePlay className="size-4" />
        Start Incident
        </Button>

        <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={!canReset}
        onClick={resetEpisode}
        className="gap-2"
        >
            <RotateCcw className="size-4" />
            Reset Episode
        </Button>
    </div>
  );
}