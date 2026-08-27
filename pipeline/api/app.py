from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from pipeline.simulator.service import FailureSimulator
from pipeline.workers.models import RenderWorker
from pipeline.workers.registry import worker_registry


app = FastAPI(
    title="RenderGuard Production Pipeline",
    version="0.1.0",
)

failure_simulator = FailureSimulator(worker_registry)


class FailureInjectionRequest(BaseModel):
    worker_id: str


class FailureInjectionResponse(BaseModel):
    failure_type: str
    worker: RenderWorker


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "renderguard-pipeline",
    }


@app.get("/pipeline/status", response_model=list[RenderWorker])
def pipeline_status() -> list[RenderWorker]:
    return worker_registry.list_workers()


@app.post("/simulation/failures/vram-leak", response_model=FailureInjectionResponse)
def inject_vram_leak(
    payload: FailureInjectionRequest,
) -> FailureInjectionResponse:
    try:
        result = failure_simulator.inject_vram_leak(
            worker_id=payload.worker_id
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return FailureInjectionResponse(
        failure_type=result.failure_type,
        worker=result.worker,
    )