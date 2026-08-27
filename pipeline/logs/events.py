from enum import StrEnum

class RenderEvent(StrEnum):
    GPU_MEMORY_PRESSURE = "gpu_memory_pressure"
    RENDER_CHUNK_FAILED = "render_chunk_failed"