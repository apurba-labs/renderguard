# RenderGuard

**Autonomous observability, policy-guarded remediation, and closed-loop verification for production media rendering.**

RenderGuard is an agentic production control room for GPU-based film and media rendering workloads. It detects render failures through real production telemetry, uses Gemini through Google ADK to investigate evidence from Grafana, applies deterministic safety policy before remediation, and independently verifies the result before declaring an incident resolved.

> **Gemini reasons. Policy authorizes. The pipeline acts. Grafana independently verifies.**

## Live Demo

**Production Control Room:**  
https://renderguard.gotihub.com

## The Problem

A 4K master render can involve many GPU workers processing expensive scenes under delivery pressure.

When a worker begins exhausting GPU memory, operators may need to correlate metrics and logs, identify the failing worker, determine whether remediation is safe, take action, and verify that the intervention actually worked.

RenderGuard turns that operational workflow into a guarded agentic loop.

The demo models a production workload:

- Episode 07
- Scene 047
- 4K MASTER
- 3840 × 2160
- GPU render fleet
- CUDA out-of-memory failure

## How It Works

```text
4K MASTER Render Pipeline
          |
          v
   GPU Render Workers
          |
          | telemetry
          v
     Grafana Cloud
   Prometheus + Loki
          |
          | official Grafana MCP
          v
 Google ADK + Gemini
          |
          v
 Evidence Correlation
          |
          v
 Deterministic Safety Policy
          |
      ALLOW / DENY
          |
          v
 Controlled Remediation
          |
          v
     Grafana Cloud
          |
          v
 Independent Verification
          |
          v
  CLOSED LOOP VERIFIED
```

### 1. Observe

RenderGuard exports worker telemetry including:

- GPU VRAM utilization
- worker health
- active render chunks
- completed chunks
- failed chunks

Structured production events are sent to Loki.

### 2. Investigate

A Gemini 2.5 Flash agent running with Google ADK uses the official Grafana MCP server to inspect real Grafana Cloud telemetry.

For the demonstrated failure, the agent correlates:

```text
render-gpu-03
VRAM: 97%
Health: unhealthy
Scene: scene-047
Chunk: segment-12
Failure: CUDA_OUT_OF_MEMORY
```

The agent does not receive pre-written incident conclusions. It queries observability tools and establishes the evidence itself.

### 3. Guard

Gemini may recommend an action, but recommendation is not authorization.

A deterministic policy evaluates whether quarantine is permitted.

The current quarantine policy requires:

- degraded worker state
- VRAM usage >= 90%
- at least one failed render chunk

Requests that do not satisfy policy are denied without changing pipeline state.

### 4. Act

When policy permits remediation, RenderGuard quarantines the affected worker through the pipeline control API.

The worker stops accepting/processing render chunks and a structured `worker_quarantined` event is emitted.

### 5. Verify

Execution success is not treated as proof of recovery.

The agent independently returns to Grafana and verifies:

- `renderguard_worker_active_chunks == 0`
- Loki contains the corresponding `worker_quarantined` event

Because production telemetry is eventually consistent, verification can retry before reaching a conclusion.

RenderGuard reports the incident as resolved only when independent observability evidence confirms the expected post-remediation state.

## Safety Model

RenderGuard deliberately separates reasoning, authorization, execution, and verification.

```text
Gemini
  |
  | proposes
  v
Deterministic Policy
  |
  | authorizes
  v
Pipeline Control
  |
  | executes
  v
Grafana
  |
  | independently verifies
  v
Final Agent Decision
```

This prevents an LLM recommendation from automatically becoming an infrastructure mutation.

Grafana MCP access is configured read-only. Write operations are exposed only through RenderGuard's narrow pipeline-control capability and remain subject to deterministic policy.

## Technology

### Google Cloud

- Gemini 2.5 Flash
- Google Agent Development Kit (ADK)
- Vertex AI
- Cloud Run
- Cloud Build
- Artifact Registry
- Secret Manager
- Google Cloud external HTTPS load balancing

### Grafana

- Grafana Cloud
- official `grafana/mcp-grafana`
- Prometheus / Grafana Cloud Metrics
- Loki
- OpenTelemetry
- Grafana dashboards

### Application

- Python 3.12
- FastAPI
- Prometheus client
- OpenTelemetry SDK
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## Production Architecture

```text
                         ┌──────────────────────┐
                         │ renderguard.gotihub  │
                         │ Production Control   │
                         │ Room                 │
                         └──────────┬───────────┘
                                    │
                         Google HTTPS Load Balancer
                                    │
                                    v
                         ┌──────────────────────┐
                         │ Cloud Run            │
                         │ renderguard-web      │
                         └──────────┬───────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
                     v                             v
          ┌────────────────────┐       ┌────────────────────┐
          │ renderguard-api    │       │ renderguard-agent  │
          │ Cloud Run          │       │ Cloud Run          │
          └─────────┬──────────┘       └─────────┬──────────┘
                    │                            │
          telemetry │                            │ Google ADK
                    │                            │ Gemini 2.5 Flash
                    v                            │
          ┌────────────────────┐                 │
          │ Grafana Cloud      │<────────────────┘
          │                    │    Grafana MCP
          │ Metrics / Loki     │
          └────────────────────┘
```

The pipeline writes telemetry to Grafana Cloud.

The agent reads that telemetry through Grafana MCP.

This creates a deliberate boundary:

```text
Pipeline → WRITE telemetry
Agent    → READ telemetry through MCP
```

## Repository Structure

```text
app/
  agent.py                 Google ADK investigation agent
  tools/                   guarded agent capabilities

pipeline/
  api/                     FastAPI control plane
  workers/                 render worker model and registry
  simulator/               reproducible production failures
  remediation/             deterministic policy + execution
  metrics/                 Prometheus and OpenTelemetry
  logs/                    structured logging + Grafana Cloud

observability/
  grafana/                 RenderGuard dashboard
  prometheus/              local Prometheus configuration
  loki/                    local Loki configuration
  alloy/                   local log collection

web/
  src/                     production control-room UI

docker/
  api/                     API production image/build
  adk/                     ADK agent production image/build
  web/                     web production image/build

scripts/
  mcp_probe.py              Grafana MCP integration probe

tests/
  metrics/
  remediation/
  simulator/
```

## Local Development

### Requirements

- Python 3.12+
- `uv`
- Docker / Docker Compose
- Node.js 22+
- Grafana service-account credentials for MCP-backed agent testing
- Google Cloud credentials for Vertex AI

Install Python dependencies:

```bash
uv sync
```

Start the RenderGuard pipeline:

```bash
uv run uvicorn pipeline.api.app:app --reload --port 8000
```

Start local observability:

```bash
docker compose up -d
```

Start the web application:

```bash
cd web
npm install
npm run dev
```

Run tests:

```bash
uv run pytest
```

## Reproducing the Incident

Inject GPU memory pressure into the demonstration worker:

```bash
curl -X POST \
  http://127.0.0.1:8000/simulation/failures/vram-leak \
  -H "Content-Type: application/json" \
  -d '{"worker_id":"render-gpu-03"}'
```

The simulator produces production-context evidence including:

```text
worker_id       render-gpu-03
job_id          episode-07-master
scene           scene-047
chunk           segment-12
resolution      3840x2160
render_profile  4K_MASTER
reason          CUDA_OUT_OF_MEMORY
```

Reset the episode:

```bash
curl -X POST \
  http://127.0.0.1:8000/simulation/reset
```

## Why RenderGuard

RenderGuard is not a chatbot wrapped around a dashboard.

The agent must gather evidence from production observability, correlate multiple signals, operate within an explicit authorization boundary, and then prove whether its own intervention worked.

The goal is not maximum autonomy.

The goal is **accountable autonomy for production operations**.

## License

Licensed under the Apache License 2.0. See [`LICENSE`](LICENSE).