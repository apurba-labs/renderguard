import json
import os
import time
from typing import Any

import requests


LOKI_URL = os.getenv("GRAFANA_LOKI_URL")
LOKI_USER = os.getenv("GRAFANA_LOKI_USER")
LOKI_TOKEN = os.getenv("GRAFANA_INGESTION_TOKEN")


def push_loki_event(
    record: dict[str, Any],
) -> None:
    if not all(
        (
            LOKI_URL,
            LOKI_USER,
            LOKI_TOKEN,
        )
    ):
        return

    timestamp_ns = str(time.time_ns())

    payload = {
        "streams": [
            {
                "stream": {
                    "service": "renderguard-pipeline",
                    "event": str(
                        record.get(
                            "event",
                            "unknown",
                        )
                    ),
                    "worker_id": str(
                        record.get(
                            "worker_id",
                            "unknown",
                        )
                    ),
                },
                "values": [
                    [
                        timestamp_ns,
                        json.dumps(record),
                    ]
                ],
            }
        ]
    }

    try:
        response = requests.post(
            LOKI_URL,
            auth=(
                LOKI_USER,
                LOKI_TOKEN,
            ),
            json=payload,
            timeout=3,
        )

        response.raise_for_status()

    except requests.RequestException:
        # Observability must never break
        # the render control plane.
        return