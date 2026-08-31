from pipeline.remediation.service import RemediationService
from pipeline.workers.models import WorkerStatus
from pipeline.workers.registry import WorkerRegistry


def test_quarantines_worker_when_policy_allows() -> None:
    registry = WorkerRegistry()
    service = RemediationService(registry)

    worker = registry.get_worker("render-gpu-03")
    assert worker is not None

    worker.status = WorkerStatus.DEGRADED
    worker.vram_used_percent = 97.0
    worker.failed_chunks = 1

    result = service.quarantine_worker(worker.worker_id)

    assert result.policy.allowed is True
    assert result.worker.status == WorkerStatus.QUARANTINED
    assert result.worker.active_chunks == 0


def test_does_not_mutate_worker_when_policy_denies() -> None:
    registry = WorkerRegistry()
    service = RemediationService(registry)

    worker = registry.get_worker("render-gpu-01")
    assert worker is not None

    original_status = worker.status
    original_active_chunks = worker.active_chunks

    result = service.quarantine_worker(worker.worker_id)

    assert result.policy.allowed is False

    assert worker.status == original_status
    assert worker.active_chunks == original_active_chunks