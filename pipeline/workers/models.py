from enum import StrEnum
from pydantic import BaseModel, Field

class WorkerStatus(StrEnum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    QUARANTINED = "quarantined"
    OFFLINE = "offline"


class RenderWorker(BaseModel):
    worker_id: str
    status: WorkerStatus = WorkerStatus.HEALTHY

    vram_used_percent: float = Field(
        default=40.0,
        ge=0.0,
        le=100.0,
    )

    active_chunks: int = Field(default=0, ge=0)
    completed_chunks: int = Field(default=0, ge=0)
    failed_chunks: int = Field(default=0, ge=0)