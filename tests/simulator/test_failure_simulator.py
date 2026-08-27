import pytest

from pipeline.simulator.service import FailureSimulator
from pipeline.workers.models import WorkerStatus
from pipeline.workers.registry import WorkerRegistry


def test_vram_leak_degrades_worker() -> None:
    registry = WorkerRegistry()
    simulator = FailureSimulator(registry)

    result = simulator.inject_vram_leak("render-gpu-03")

    assert result.worker.worker_id == "render-gpu-03"
    assert result.worker.status == WorkerStatus.DEGRADED
    assert result.worker.vram_used_percent == 97.0
    assert result.worker.failed_chunks == 1


def test_vram_leak_rejects_unknown_worker() -> None:
    registry = WorkerRegistry()
    simulator = FailureSimulator(registry)

    with pytest.raises(
        ValueError,
        match="Worker 'render-gpu-99' was not found",
    ):
        simulator.inject_vram_leak("render-gpu-99")