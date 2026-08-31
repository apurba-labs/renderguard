import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def quarantine_worker(worker_id: str) -> dict:
    """Request guarded quarantine of a RenderGuard worker.

    The pipeline API performs the authoritative policy check.
    This tool does not bypass or duplicate authorization logic.
    """

    base_url = os.environ.get(
        "RENDERGUARD_PIPELINE_URL",
        "http://host.docker.internal:8000",
    )

    url = (
        f"{base_url}/pipeline/workers/"
        f"{worker_id}/quarantine"
    )

    request = Request(
        url=url,
        method="POST",
    )

    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    except HTTPError as exc:
        return {
            "allowed": False,
            "error": f"Pipeline API returned HTTP {exc.code}.",
        }

    except URLError as exc:
        return {
            "allowed": False,
            "error": f"Pipeline API unavailable: {exc.reason}",
        }