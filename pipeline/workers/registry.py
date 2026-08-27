from pipeline.workers.models import RenderWorker

class WorkerRegistry:
    def __init__(self) -> None:
        self._workers: dict[str, RenderWorker] = {
            f"render-gpu-{number:02d}": RenderWorker(
                worker_id=f"render-gpu-{number:02d}",
                vram_used_percent=38.0 + (number * 3),
                active_chunks=2,
            )
            for number in range(1, 5)
        }

    def list_workers(self) -> list[RenderWorker]:
        return list(self._workers.values())

    def get_worker(self, worker_id: str) -> RenderWorker | None:
        return self._workers.get(worker_id)

worker_registry = WorkerRegistry()