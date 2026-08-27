from fastapi import FastAPI

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