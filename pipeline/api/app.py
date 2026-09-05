from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from pipeline.metrics.prometheus import update_worker_metrics

from pipeline.simulator.service import FailureSimulator
from pipeline.workers.models import RenderWorker
from pipeline.workers.registry import worker_registry
from pipeline.metrics.otel import initialize_otel_metrics

from pipeline.remediation.service import RemediationService


app = FastAPI(
    title="RenderGuard Production Pipeline",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://renderguard.gotihub.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

failure_simulator = FailureSimulator(worker_registry)
remediation_service = RemediationService(worker_registry)
initialize_otel_metrics(worker_registry)

class FailureInjectionRequest(BaseModel):
    worker_id: str


class FailureInjectionResponse(BaseModel):
    failure_type: str
    worker: RenderWorker

class QuarantineResponse(BaseModel):
    allowed: bool
    reason: str
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
    
@app.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    update_worker_metrics(worker_registry)

    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )
    
@app.post(
    "/pipeline/workers/{worker_id}/quarantine",
    response_model=QuarantineResponse,
)
def quarantine_worker(worker_id: str) -> QuarantineResponse:
    try:
        result = remediation_service.quarantine_worker(worker_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return QuarantineResponse(
        allowed=result.policy.allowed,
        reason=result.policy.reason,
        worker=result.worker,
    )
    
@app.post("/simulation/reset")
def reset_simulation():
    return failure_simulator.reset_workers()