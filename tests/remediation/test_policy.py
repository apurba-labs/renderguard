from pipeline.remediation.policy import can_quarantine_worker
from pipeline.workers.models import RenderWorker, WorkerStatus


def test_allows_quarantine_for_critical_degraded_worker() -> None:
    worker = RenderWorker(
        worker_id="render-gpu-03",
        status=WorkerStatus.DEGRADED,
        vram_used_percent=97.0,
        active_chunks=2,
        failed_chunks=1,
    )

    decision = can_quarantine_worker(worker)

    assert decision.allowed is True
    assert decision.reason == (
        "Worker satisfies the quarantine safety policy."
    )


def test_denies_quarantine_for_healthy_worker() -> None:
    worker = RenderWorker(
        worker_id="render-gpu-01",
        status=WorkerStatus.HEALTHY,
        vram_used_percent=41.0,
        active_chunks=2,
        failed_chunks=0,
    )

    decision = can_quarantine_worker(worker)

    assert decision.allowed is False
    assert decision.reason == (
        "Worker must be degraded before quarantine."
    )