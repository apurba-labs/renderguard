from fastapi import FastAPI

from pipeline.workers.models import RenderWorker
from pipeline.workers.registry import worker_registry


app = FastAPI(
    title="RenderGuard Production Pipeline",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "renderguard-pipeline",
    }


@app.get("/pipeline/status", response_model=list[RenderWorker])
def pipeline_status() -> list[RenderWorker]:
    return worker_registry.list_workers()