import type {
  AdkEvent,
  AdkFunctionCall,
  AdkFunctionResponse,
  RenderGuardAgentEvent,
} from "./types";

type MapperState = {
  remediationStarted: boolean;
  remediationAllowed: boolean;
  prometheusVerified: boolean;
  lokiVerified: boolean;
  seenFunctionCalls: Set<string>;
};

export function createMapperState(): MapperState {
  return {
    remediationStarted: false,
    remediationAllowed: false,
    prometheusVerified: false,
    lokiVerified: false,
    seenFunctionCalls: new Set(),
  };
}

function mapFunctionCall(
  call: AdkFunctionCall,
  state: MapperState,
): RenderGuardAgentEvent | null {
  if (state.seenFunctionCalls.has(call.id)) {
    return null;
  }

  state.seenFunctionCalls.add(call.id);

  if (call.name === "quarantine_worker") {
    state.remediationStarted = true;

    return {
      stage: "guard",
      status: "running",
      message: `Evaluating quarantine for ${
        String(call.args?.worker_id ?? "worker")
      }`,
    };
  }

  if (call.name.includes("prometheus")) {
    return {
      stage: state.remediationStarted
        ? "verify"
        : "observe",
      status: "running",
      message: state.remediationStarted
        ? "Verifying remediation through Prometheus"
        : "Inspecting Prometheus telemetry",
    };
  }

  if (
    call.name.includes("loki") ||
    call.name.includes("log")
  ) {
    return {
      stage: state.remediationStarted
        ? "verify"
        : "correlate",
      status: "running",
      message: state.remediationStarted
        ? "Verifying remediation through Loki"
        : "Correlating Loki evidence",
    };
  }

  return null;
}

function getResponseText(response: AdkFunctionResponse): string | null {
  const content = response.response?.content;

  if (!Array.isArray(content)) {
    return null;
  }

  for (const item of content) {
    if (
      typeof item === "object" &&
      item !== null &&
      "text" in item &&
      typeof item.text === "string"
    ) {
      return item.text;
    }
  }

  return null;
}

function mapFunctionResponse(
  response: AdkFunctionResponse,
  state: MapperState,
): RenderGuardAgentEvent[] {
  const events: RenderGuardAgentEvent[] = [];

  if (response.name === "quarantine_worker") {
    const allowed = response.response?.allowed === true;

    state.remediationAllowed = allowed;

    if (!allowed) {
      events.push({
        stage: "guard",
        status: "failed",
        message:
          typeof response.response?.reason === "string"
            ? response.response.reason
            : "Quarantine denied by policy",
      });

      return events;
    }

    events.push({
      stage: "guard",
      status: "success",
      message: "Deterministic policy returned ALLOW",
    });

    events.push({
      stage: "act",
      status: "success",
      message: "Worker removed from active render scheduling",
    });

    return events;
  }

  if (
    !state.remediationStarted ||
    !state.remediationAllowed
  ) {
    return events;
  }

  const text = getResponseText(response);

  if (!text) {
    return events;
  }

  if (response.name === "query_prometheus") {
    if (
      text.includes("renderguard_worker_active_chunks") &&
      text.includes('"worker_id":"render-gpu-03"')
    ) {
      try {
        const parsed = JSON.parse(text) as {
          data?: Array<{
            metric?: {
              worker_id?: string;
            };
            value?: [number, string];
          }>;
        };

        const worker = parsed.data?.find(
          (item) =>
            item.metric?.worker_id ===
            "render-gpu-03",
        );

        if (worker?.value?.[1] === "0") {
          state.prometheusVerified = true;

          events.push({
            stage: "verify",
            status:
              state.lokiVerified
                ? "success"
                : "running",
            message:
              "Prometheus confirms render-gpu-03 has zero active chunks",
          });
        }
      } catch {
        // Ignore malformed external tool payloads.
      }
    }
  }

  if (
    response.name.includes("loki") &&
    text.includes("worker_quarantined") &&
    text.includes("render-gpu-03")
  ) {
    state.lokiVerified = true;

    events.push({
      stage: "verify",
      status:
        state.prometheusVerified
          ? "success"
          : "running",
      message:
        "Loki confirms worker_quarantined audit event",
    });
  }

  if (
    state.prometheusVerified &&
    state.lokiVerified
  ) {
    events.push({
      stage: "complete",
      status: "success",
      message:
        "Remediation independently verified through Prometheus and Loki",
    });
  }

  return events;
}

export function mapAdkEvent(
  event: AdkEvent,
  state: MapperState,
): RenderGuardAgentEvent[] {
  const mapped: RenderGuardAgentEvent[] = [];

  for (const part of event.content?.parts ?? []) {
    /*
     * Gemini can emit its decision text and the
     * remediation function call in the same ADK event.
     *
     * Capture the decision BEFORE the function call
     * transitions us into remediation state.
     */
    if (
      part.text &&
      !event.partial &&
      !state.remediationStarted
    ) {
      mapped.push({
        stage: "decide",
        status: "success",
        message: part.text,
      });
    }

    if (part.functionCall) {
      const result = mapFunctionCall(
        part.functionCall,
        state,
      );

      if (result) {
        mapped.push(result);
      }
    }

    if (part.functionResponse) {
      const results = mapFunctionResponse(
        part.functionResponse,
        state,
      );

      mapped.push(...results);
    }
  }

  return mapped;
}