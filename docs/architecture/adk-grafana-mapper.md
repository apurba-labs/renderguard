# Google ADK, Grafana MCP & `mapper.ts` Integration

This document describes the end-to-end telemetry and incident lifecycle powering **RenderGuard**.

It explains how the Google ADK agent powered by Gemini interacts with Grafana Cloud through the Model Context Protocol (MCP), how remediation is protected by deterministic application policy, and how `mapper.ts` transforms raw ADK/MCP execution events into the live incident timeline displayed in the RenderGuard control room.

---

## Architecture Overview

```text
                    ┌──────────────────────────────┐
                    │ Google ADK Agent             │
                    │ Gemini 2.5 Flash             │
                    │ Vertex AI                    │
                    └──────────────┬───────────────┘
                                   │
                            MCP Tool Calls
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Official Grafana MCP Server  │
                    │ mcp-grafana (read-only)      │
                    └──────────────┬───────────────┘
                                   │
                            PromQL / LogQL
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Grafana Cloud                │
                    │                              │
                    │ Prometheus / Metrics         │
                    │ Loki / Structured Logs       │
                    └──────────────┬───────────────┘
                                   │
                              Evidence
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Google ADK Agent             │
                    │ Investigation + Correlation  │
                    └──────────────┬───────────────┘
                                   │
                         Proposed Remediation
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Deterministic Remediation    │
                    │ Policy                       │
                    └──────────────┬───────────────┘
                                   │
                              ALLOW / DENY
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ Pipeline Control API         │
                    │ quarantine_worker            │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                            Render Pipeline


ADK / MCP Execution Events
            │
            ▼
┌──────────────────────────────┐
│ mapper.ts                    │
│ Presentation Transformer     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ RenderGuard Control Room     │
│ Live Incident Timeline       │
└──────────────────────────────┘
```

The core control-loop principle is:

> **Gemini reasons. Policy authorizes. The pipeline acts. Grafana independently verifies.**

---

## Why `mapper.ts` Exists

The Google ADK runtime emits low-level agent events, function calls, function responses, and MCP payloads.

These events contain the evidence needed by RenderGuard, but their raw structure is too implementation-specific for the control-room UI.

`mapper.ts` acts as a presentation-layer transformer.

It does **not** decide whether remediation is required, authorize infrastructure actions, or modify the render pipeline.

Its responsibilities are limited to:

1. interpreting ADK and MCP execution events;
2. extracting relevant Prometheus and Loki evidence;
3. mapping those events to RenderGuard's incident lifecycle;
4. maintaining presentation-level verification state; and
5. producing the human-readable timeline displayed in the control room.

The source of truth remains the underlying:

- Gemini / Google ADK execution;
- Grafana MCP telemetry;
- deterministic remediation policy;
- pipeline control state; and
- independently observed Grafana telemetry.

This separation prevents the UI from becoming part of the authorization or remediation boundary.

---

# 1. Incident Lifecycle

RenderGuard models the autonomous incident lifecycle as:

```text
OBSERVE
   ↓
INVESTIGATE
   ↓
CORRELATE
   ↓
DECIDE
   ↓
GUARD
   ↓
ACT
   ↓
VERIFY
   ↓
COMPLETE
```

Each stage is backed by real agent execution and telemetry rather than a scripted UI sequence.

---

## Step 1: Metric Discovery & Initial Inspection

### Agent Interaction

The Google ADK agent begins by discovering the telemetry available through the official Grafana MCP server.

The agent can execute:

```text
list_datasources
```

to discover Grafana Cloud telemetry sources.

It can then inspect available Prometheus metrics, including RenderGuard worker gauges such as:

```text
renderguard_worker_vram_percent
renderguard_worker_health
renderguard_worker_active_chunks
renderguard_worker_failed_chunks_total
```

The agent issues PromQL queries through Grafana MCP to inspect the current render fleet.

For the simulated production incident, telemetry identifies:

```text
worker_id = render-gpu-03
VRAM      = 97%
health    = 0
```

while the remaining workers remain healthy.

### `mapper.ts` Handling

When a Prometheus function response arrives, `mapper.ts` normalizes the MCP response and searches the returned metric entries for:

```text
worker_id = render-gpu-03
```

The mapper can then surface evidence such as:

```text
renderguard_worker_vram_percent = 97
renderguard_worker_health = 0
```

to the incident timeline.

This produces the UI representation of the **Observe** stage.

---

## Step 2: Loki Evidence Correlation

Metrics identify that something is wrong, but they do not provide the complete failure context.

The agent therefore correlates the metric anomaly with structured production logs.

### Agent Interaction

After detecting the unhealthy worker, the ADK agent queries Loki through Grafana MCP.

A representative LogQL filter is:

```logql
{worker_id="render-gpu-03"}
```

The returned structured logs contain events such as:

```text
gpu_memory_pressure
render_chunk_failed
```

with production metadata including:

```text
worker_id      = render-gpu-03
job_id         = episode-07-master
scene          = scene-047
chunk          = segment-12
resolution     = 3840x2160
render_profile = 4K_MASTER
reason         = CUDA_OUT_OF_MEMORY
```

This allows Gemini to correlate the Prometheus metric anomaly with the actual rendering failure.

### `mapper.ts` Handling

The mapper normalizes the Loki MCP payload and traverses returned log entries.

It looks for relevant evidence such as:

```text
CUDA_OUT_OF_MEMORY
gpu_memory_pressure
render_chunk_failed
```

When correlated evidence is observed, the mapper emits the corresponding timeline event:

```text
stage  = correlate
status = success
```

The important distinction is that `mapper.ts` is **displaying the evidence discovered by the agent**. It is not independently diagnosing the production incident.

---

## Step 3: Decision & Governed Remediation

After correlating Prometheus and Loki evidence, Gemini can recommend an appropriate remediation.

For the RenderGuard scenario, the proposed action is:

```text
quarantine render-gpu-03
```

However, an LLM recommendation is not sufficient authorization to modify production state.

RenderGuard deliberately separates reasoning from authorization.

```text
Gemini recommendation
        │
        ▼
Deterministic policy
        │
    ┌───┴───┐
    │       │
  ALLOW    DENY
    │
    ▼
Pipeline Control
```

### Agent Interaction

The ADK agent invokes the narrow remediation tool:

```text
quarantine_worker
```

for:

```text
render-gpu-03
```

Before the pipeline mutation occurs, RenderGuard's deterministic application-level remediation policy evaluates the current worker state.

The quarantine policy requires evidence such as:

```text
worker status = DEGRADED
VRAM >= 90%
failed_chunks >= 1
```

If the conditions are satisfied, the policy returns an ALLOW decision.

A representative response is:

```json
{
  "allowed": true,
  "reason": "Worker satisfies the quarantine safety policy."
}
```

The pipeline control service can then quarantine the worker and remove it from active render scheduling.

### `mapper.ts` Handling

When the remediation function response is observed, the mapper confirms:

```text
allowed = true
```

and represents the policy decision as:

```text
stage  = guard
status = success
message = "Deterministic policy returned ALLOW"
```

It then represents successful execution as:

```text
stage  = act
status = success
message = "Worker removed from active render scheduling"
```

Internal presentation state can record:

```text
state.remediationStarted = true
state.remediationAllowed = true
```

These flags describe the execution timeline.

They do **not** authorize the action.

Authorization has already occurred inside the deterministic remediation policy on the backend.

---

## Step 4: Independent Post-Remediation Verification

A successful remediation response is not treated as proof that the production environment reached the desired state.

This distinction is fundamental to RenderGuard.

```text
Action accepted
      ≠
Recovery verified
```

After remediation, the agent independently returns to Grafana.

### Prometheus Verification

The agent queries:

```promql
renderguard_worker_active_chunks{worker_id="render-gpu-03"}
```

The expected verified state is:

```text
active_chunks = 0
```

This indicates that the quarantined worker is no longer processing active render work.

### Loki Verification

The agent independently queries Loki for the quarantine audit event.

A representative query is:

```logql
{worker_id="render-gpu-03"} |= "quarantined"
```

The resulting structured event contains evidence similar to:

```json
{
  "event": "worker_quarantined",
  "worker_id": "render-gpu-03",
  "status": "quarantined"
}
```

### `mapper.ts` Handling

For the Prometheus response, the mapper confirms that the metric entry associated with:

```text
worker_id = render-gpu-03
```

reports:

```text
value[1] = "0"
```

It can then set:

```text
state.prometheusVerified = true
```

For Loki, the mapper confirms that the returned evidence contains:

```text
worker_quarantined
```

and sets:

```text
state.lokiVerified = true
```

Neither signal alone completes the closed loop.

---

# 2. Eventual Consistency During Verification

RenderGuard intentionally does not assume that control-plane state and observability state become synchronized immediately.

After quarantine, the pipeline control service may already report:

```text
active_chunks = 0
```

while Grafana Cloud still temporarily exposes the previously exported value:

```text
active_chunks = 2
```

This is normal behavior in distributed telemetry pipelines.

The sequence can look like:

```text
Pipeline state changes
        │
        ▼
Worker quarantined
active_chunks = 0
        │
        ▼
Telemetry exported
        │
        ▼
Grafana Cloud ingestion
        │
        ▼
Prometheus query reflects new state
```

During production testing, RenderGuard encountered exactly this condition.

The first post-remediation Prometheus query still returned:

```text
active_chunks = 2
```

The agent did **not** declare the incident resolved.

Instead, it recognized that independent verification had not completed and retried the telemetry query.

A subsequent Grafana MCP query returned:

```text
active_chunks = 0
```

while Loki independently exposed:

```text
worker_quarantined
```

Only after both signals were observed did RenderGuard consider the remediation independently verified.

This separates three important concepts:

### Action Acknowledgement

The pipeline control API accepted and executed the remediation.

### Observed State

Grafana telemetry reflects the resulting system state.

### Verified Recovery

Independent metrics and logs confirm that the intended remediation outcome actually occurred.

This is why RenderGuard does not treat a successful tool response as proof of recovery.

---

# 3. Closed-Loop Completion

The mapper maintains presentation-level verification state:

```text
state.prometheusVerified
state.lokiVerified
```

Closed-loop completion occurs only when both independent telemetry signals have been observed:

```text
prometheusVerified = true
AND
lokiVerified = true
```

The mapper can then set:

```text
state.verificationComplete = true
```

and emit the terminal timeline event:

```text
stage   = complete
status  = success
message = "Remediation independently verified by Grafana telemetry."
```

The resulting control loop is therefore:

```text
Observe
   ↓
Investigate
   ↓
Correlate
   ↓
Decide
   ↓
Guard
   ↓
Act
   ↓
Re-observe
   ↓
Verify Prometheus
   +
Verify Loki
   ↓
Complete
```

---

# 4. Why Grafana MCP Is Read-Only

RenderGuard intentionally uses the Grafana MCP integration as an **evidence plane**, not as the infrastructure mutation path.

```text
Grafana MCP
     │
     ├── Prometheus metrics
     ├── Loki logs
     ├── datasource discovery
     └── observability queries

              READ-ONLY
```

Production mutations occur through a separate, narrow pipeline control interface:

```text
Google ADK
    │
    ▼
quarantine_worker
    │
    ▼
Deterministic Policy
    │
    ▼
Pipeline Control API
```

This creates an explicit security boundary:

```text
Evidence Plane                     Action Plane

Grafana MCP                        Pipeline Control
Prometheus                         quarantine_worker
Loki                 ─────►        deterministic policy
read-only                           controlled mutation
```

Observability access therefore does not automatically grant infrastructure mutation capability.

---

# 5. `mapper.ts` Implementation Checklist

When maintaining or extending `mapper.ts`, preserve the following behavior.

## Flexible Function Matching

MCP tool names can include prefixes or implementation-specific naming variations.

Avoid unnecessarily brittle strict equality checks where appropriate.

For example:

```ts
response.name.includes("prometheus")
```

and:

```ts
response.name.includes("loki")
```

can be safer than depending on one exact MCP-generated function name.

---

## Payload Normalization

MCP responses may be wrapped differently depending on the tool and query type.

Prometheus responses may expose result arrays through structures such as:

```text
parsedPayload.data
```

or:

```text
parsedPayload.data.result
```

Loki responses may similarly contain nested stream or entry structures.

Normalize the wrapper before interpreting telemetry.

---

## Recursive Loki Evidence Extraction

Structured Loki responses can contain nested values.

Evidence extraction should traverse the actual returned payload rather than relying on one rigid response shape.

The mapper should identify meaningful log evidence such as:

```text
CUDA_OUT_OF_MEMORY
gpu_memory_pressure
render_chunk_failed
worker_quarantined
```

while avoiding false positives from query expressions or tool-call arguments themselves.

---

## Preserve the Authorization Boundary

Never move remediation authorization into `mapper.ts`.

The mapper may display:

```text
ALLOW
DENY
```

but the actual decision must remain in the backend deterministic remediation policy.

Correct:

```text
Backend policy decides ALLOW
        ↓
mapper.ts observes result
        ↓
UI displays ALLOW
```

Incorrect:

```text
mapper.ts decides ALLOW
        ↓
UI triggers remediation
```

---

## Preserve Independent Verification

Never mark remediation complete merely because:

```text
quarantine_worker
```

returned successfully.

Completion requires independently observed Grafana telemetry.

At minimum:

```text
Prometheus:
active_chunks == 0

AND

Loki:
worker_quarantined observed
```

Only then should the UI display closed-loop verification.

---

# 6. Responsibility Boundaries

| Component | Responsibility |
|---|---|
| Gemini 2.5 Flash | Reason about telemetry and determine the appropriate proposed response |
| Google ADK | Agent runtime, tool orchestration, sessions, and execution flow |
| Grafana MCP | Structured read-only access to observability tools |
| Prometheus / Grafana Cloud Metrics | Quantitative worker and pipeline state |
| Loki | Structured production and audit-event evidence |
| Deterministic Remediation Policy | Authorize or deny the proposed action |
| Pipeline Control API | Execute the approved remediation |
| `mapper.ts` | Transform execution evidence into UI timeline state |
| RenderGuard Control Room | Present incident state, agent activity, policy decisions, and verification |

---

# 7. Design Principle

RenderGuard deliberately avoids giving an LLM unrestricted operational authority.

The system separates:

```text
Reasoning
    │
    ▼
Authorization
    │
    ▼
Execution
    │
    ▼
Independent Verification
```

or, more simply:

> **Gemini reasons. Policy authorizes. The pipeline acts. Grafana independently verifies.**

This architecture allows an agent to participate meaningfully in production operations without treating model reasoning itself as an authorization mechanism.

The result is an autonomous control loop where actions remain constrained by deterministic policy and recovery claims remain grounded in independently observed telemetry.