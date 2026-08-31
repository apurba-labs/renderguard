from dataclasses import dataclass

from pipeline.workers.models import RenderWorker, WorkerStatus


CRITICAL_VRAM_PERCENT = 90.0


@dataclass(frozen=True)
class PolicyDecision:
    allowed: bool
    reason: str


def can_quarantine_worker(worker: RenderWorker) -> PolicyDecision:
    if worker.status != WorkerStatus.DEGRADED:
        return PolicyDecision(
            allowed=False,
            reason="Worker must be degraded before quarantine.",
        )

    if worker.vram_used_percent < CRITICAL_VRAM_PERCENT:
        return PolicyDecision(
            allowed=False,
            reason=(
                f"Worker VRAM must be at least "
                f"{CRITICAL_VRAM_PERCENT}% before quarantine."
            ),
        )

    if worker.failed_chunks < 1:
        return PolicyDecision(
            allowed=False,
            reason="Worker must have at least one failed render chunk.",
        )

    return PolicyDecision(
        allowed=True,
        reason="Worker satisfies the quarantine safety policy.",
    )