FROM python:3.12-slim

WORKDIR /workspace

COPY pyproject.toml uv.lock README.md ./

RUN pip install --no-cache-dir uv \
    && uv sync \
       --frozen \
       --no-dev \
       --no-install-project

COPY pipeline ./pipeline

RUN mkdir -p /workspace/runtime/logs

ENV PATH="/workspace/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "uvicorn pipeline.api.app:app --host 0.0.0.0 --port ${PORT:-8080}"]