import json
import logging
from pathlib import Path
from typing import Any


LOG_DIR = Path("runtime/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("renderguard.pipeline")
logger.setLevel(logging.INFO)
logger.propagate = False

if not logger.handlers:
    formatter = logging.Formatter("%(message)s")

    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    file_handler = logging.FileHandler(
        LOG_DIR / "pipeline.jsonl",
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)


def emit_render_event(
    event: str,
    **payload: Any,
) -> None:
    record = {
        "service": "renderguard-pipeline",
        "event": event,
        **payload,
    }

    logger.info(json.dumps(record))