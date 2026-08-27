from prometheus_client import REGISTRY

from pipeline.metrics.prometheus import update_worker_metrics
from pipeline.simulator.service import FailureSimulator
from pipeline.workers.registry import WorkerRegistry


def get_metric_value(
    metric_name: str,
    worker_id: str,
) -> float | None:
    return REGISTRY.get_sample_value(
        metric_name,
        labels={"worker_id": worker_id},
    )


def test_metrics_reflect_worker_failure() -> None:
    registry = WorkerRegistry()
    simulator = FailureSimulator(registry)

    simulator.inject_vram_leak("render-gpu-03")

    update_worker_metrics(registry)

    assert get_metric_value(
        "renderguard_worker_vram_percent",
        "render-gpu-03",
    ) == 97.0

    assert get_metric_value(
        "renderguard_worker_failed_chunks_total",
        "render-gpu-03",
    ) == 3.0

    assert get_metric_value(
        "renderguard_worker_health",
        "render-gpu-03",
    ) == 0.0