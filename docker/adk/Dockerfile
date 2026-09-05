FROM grafana/mcp-grafana:latest AS grafana-mcp

FROM python:3.12-slim

WORKDIR /workspace

COPY --from=grafana-mcp /app/mcp-grafana /usr/local/bin/mcp-grafana

COPY docker/adk/requirements.txt /tmp/requirements.txt

RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY app ./app

CMD ["sh", "-c", "adk api_server app --host 0.0.0.0 --port ${PORT:-8080}"]