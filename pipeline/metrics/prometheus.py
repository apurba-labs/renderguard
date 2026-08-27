from prometheus_client import Gauge

from pipeline.workers.models import WorkerStatus
from pipeline.workers.registry import WorkerRegistry


worker_vram_percent = Gauge(
    "renderguard_worker_vram_percent",
    "Current GPU VRAM utilization percentage for a render worker.",
    ["worker_id"],
)

worker_active_chunks = Gauge(
    "renderguard_worker_active_chunks",
    "Number of render chunks currently assigned to a worker.",
    ["worker_id"],
)

worker_completed_chunks = Gauge(
    "renderguard_worker_completed_chunks_total",
    "Total number of completed render chunks reported by a worker.",
    ["worker_id"],
)

worker_failed_chunks = Gauge(
    "renderguard_worker_failed_chunks_total",
    "Total number of failed render chunks reported by a worker.",
    ["worker_id"],
)

worker_health = Gauge(
    "renderguard_worker_health",
    "Worker health state where 1 is healthy and 0 is unhealthy.",
    ["worker_id"],
)


def update_worker_metrics(registry: WorkerRegistry) -> None:
    for worker in registry.list_workers():
        worker_vram_percent.labels(
            worker_id=worker.worker_id
        ).set(worker.vram_used_percent)

        worker_active_chunks.labels(
            worker_id=worker.worker_id
        ).set(worker.active_chunks)

        worker_completed_chunks.labels(
            worker_id=worker.worker_id
        ).set(worker.completed_chunks)

        worker_failed_chunks.labels(
            worker_id=worker.worker_id
        ).set(worker.failed_chunks)

        worker_health.labels(
            worker_id=worker.worker_id
        ).set(
            1.0
            if worker.status == WorkerStatus.HEALTHY
            else 0.0
        )