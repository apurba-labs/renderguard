from dataclasses import dataclass

from pipeline.logs.events import RenderEvent
from pipeline.logs.logger import emit_render_event
from pipeline.simulator.failures import FailureType
from pipeline.workers.models import RenderWorker, WorkerStatus
from pipeline.workers.registry import WorkerRegistry

@dataclass(frozen=True)
class FailureResult:
    worker: RenderWorker
    failure_type: FailureType


class FailureSimulator:
    def __init__(self, registry: WorkerRegistry) -> None:
        self._registry = registry

    def inject_vram_leak(self, worker_id: str) -> FailureResult:
        worker = self._registry.get_worker(worker_id)

        if worker is None:
            raise ValueError(f"Worker '{worker_id}' was not found.")

        if worker.status == WorkerStatus.QUARANTINED:
            raise ValueError(
                f"Cannot inject failure into quarantined worker '{worker_id}'."
            )

        worker.vram_used_percent = 97.0
        worker.status = WorkerStatus.DEGRADED
        worker.failed_chunks += 1
        
        emit_render_event(
            RenderEvent.GPU_MEMORY_PRESSURE,
            worker_id=worker.worker_id,
            job_id="episode-07-master",
            scene="scene-047",
            resolution="3840x2160",
            render_profile="4K_MASTER",
            vram_percent=worker.vram_used_percent,
        )

        emit_render_event(
            RenderEvent.RENDER_CHUNK_FAILED,
            worker_id=worker.worker_id,
            job_id="episode-07-master",
            scene="scene-047",
            chunk="segment-12",
            resolution="3840x2160",
            reason="CUDA_OUT_OF_MEMORY",
        )

        return FailureResult(
            worker=worker,
            failure_type=FailureType.VRAM_LEAK,
        )