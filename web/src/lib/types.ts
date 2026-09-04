export type WorkerStatus =
  | "healthy"
  | "degraded"
  | "quarantined"
  | "offline";

export type RenderWorker = {
  worker_id: string;
  status: WorkerStatus;
  vram_used_percent: number;
  active_chunks: number;
  completed_chunks: number;
  failed_chunks: number;
};