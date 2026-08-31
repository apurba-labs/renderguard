from dataclasses import dataclass

from pipeline.remediation.policy import PolicyDecision, can_quarantine_worker
from pipeline.workers.models import RenderWorker, WorkerStatus
from pipeline.workers.registry import WorkerRegistry

from pipeline.logs.events import RenderEvent
from pipeline.logs.logger import emit_render_event

@dataclass(frozen=True)
class RemediationResult:
    worker: RenderWorker
    policy: PolicyDecision


class RemediationService:
    def __init__(self, registry: WorkerRegistry) -> None:
        self._registry = registry

    def quarantine_worker(self, worker_id: str) -> RemediationResult:
        worker = self._registry.get_worker(worker_id)

        if worker is None:
            raise ValueError(f"Worker '{worker_id}' was not found.")

        decision = can_quarantine_worker(worker)

        if not decision.allowed:
            return RemediationResult(
                worker=worker,
                policy=decision,
            )
            
        previous_status = worker.status

        worker.status = WorkerStatus.QUARANTINED
        worker.active_chunks = 0
        
        emit_render_event(
            RenderEvent.WORKER_QUARANTINED,
            worker_id=worker.worker_id,
            previous_status=previous_status,
            status=worker.status,
            reason="critical_vram_pressure",
        )

        return RemediationResult(
            worker=worker,
            policy=decision,
        )