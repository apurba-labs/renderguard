from __future__ import annotations

import os

from opentelemetry import metrics
from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
    OTLPMetricExporter,
)
from opentelemetry.metrics import Observation
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import (
    PeriodicExportingMetricReader,
)
from opentelemetry.sdk.resources import (
    SERVICE_NAME,
    Resource,
)

from pipeline.workers.models import WorkerStatus
from pipeline.workers.registry import WorkerRegistry


_initialized = False
_instruments = []


def initialize_otel_metrics(
    registry: WorkerRegistry,
) -> None:
    global _initialized

    if _initialized:
        return

    if not (
        os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
        and os.getenv("OTEL_EXPORTER_OTLP_HEADERS")
    ):
        return

    exporter = OTLPMetricExporter()

    reader = PeriodicExportingMetricReader(
        exporter,
        export_interval_millis=5_000,
    )

    provider = MeterProvider(
        resource=Resource.create(
            {
                SERVICE_NAME: "renderguard-pipeline",
                "deployment.environment": os.getenv(
                    "RENDERGUARD_ENV",
                    "development",
                ),
            }
        ),
        metric_readers=[reader],
    )

    metrics.set_meter_provider(provider)

    meter = metrics.get_meter(
        "renderguard.pipeline"
    )

    def observations(attribute: str):
        def callback(options):
            return [
                Observation(
                    getattr(worker, attribute),
                    {
                        "worker_id": worker.worker_id,
                    },
                )
                for worker in registry.list_workers()
            ]

        return callback

    def health_callback(options):
        return [
            Observation(
                (
                    1
                    if worker.status == WorkerStatus.HEALTHY
                    else 0
                ),
                {
                    "worker_id": worker.worker_id,
                },
            )
            for worker in registry.list_workers()
        ]

    _instruments.append(
        meter.create_observable_gauge(
            "renderguard_worker_vram_percent",
            callbacks=[
                observations("vram_used_percent")
            ],
        )
    )

    _instruments.append(
        meter.create_observable_gauge(
            "renderguard_worker_active_chunks",
            callbacks=[
                observations("active_chunks")
            ],
        )
    )

    _instruments.append(
        meter.create_observable_gauge(
            "renderguard_worker_completed_chunks_total",
            callbacks=[
                observations("completed_chunks")
            ],
        )
    )

    _instruments.append(
        meter.create_observable_gauge(
            "renderguard_worker_failed_chunks_total",
            callbacks=[
                observations("failed_chunks")
            ],
        )
    )

    _instruments.append(
        meter.create_observable_gauge(
            "renderguard_worker_health",
            callbacks=[health_callback],
        )
    )

    _initialized = True