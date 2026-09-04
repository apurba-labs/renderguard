FROM python:3.12-slim

WORKDIR /workspace

COPY pyproject.toml uv.lock README.md ./

RUN pip install --no-cache-dir uv \
    && uv sync \
       --frozen \
       --no-dev \
       --no-install-project

COPY pipeline ./pipeline

RUN mkdir -p /workspace/runtime/logs \
    && useradd --create-home --uid 10001 renderguard \
    && chown -R renderguard:renderguard /workspace

ENV PATH="/workspace/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

USER renderguard

CMD ["sh", "-c", "uvicorn pipeline.api.app:app --host 0.0.0.0 --port ${PORT:-8080}"]