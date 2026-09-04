import type {
  AdkEvent,
  AdkFunctionCall,
  AdkFunctionResponse,
  AgentActivity,
  RenderGuardAgentEvent,
} from "./types";

export type MapperState = {
  remediationStarted: boolean;
  remediationAllowed: boolean;
  prometheusVerified: boolean;
  lokiVerified: boolean;
  verificationComplete: boolean;
  seenFunctionCalls: Set<string>;
  targetWorkerId: string | null;
};

type ParsedResponse = {
  allowed?: boolean;
  reason?: string;
  data?: unknown;
  result?: unknown;
  content?: unknown;
  isError?: boolean;
};

export function createMapperState(): MapperState {
  return {
    remediationStarted: false,
    remediationAllowed: false,
    prometheusVerified: false,
    lokiVerified: false,
    verificationComplete: false,
    seenFunctionCalls: new Set(),
    targetWorkerId: null,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}
/**
 * Robustly parses stringified or nested JSON payloads returned by ADK/MCP.
 */
function parseResponseContent(response: AdkFunctionResponse): ParsedResponse | unknown[] | string {
  try {
    // Check inside response.response or content array
    let rawText: string | null = null;

    if (typeof response.response === "string") {
      rawText = response.response;
    } else if (response.response && typeof response.response === "object") {
      const content = (response.response as Record<string, unknown>).content;
      if (Array.isArray(content) && content[0]?.text) {
        rawText = String(content[0].text);
      } else {
        return response.response;
      }
    }

    if (rawText) {
      return JSON.parse(rawText);
    }
  } catch {
    // If double stringified or invalid JSON, return raw string
    if (typeof response.response === "string") return response.response;
  }
  return response.response ?? {};
}

function mapFunctionCall(
  call: AdkFunctionCall,
  state: MapperState,
): RenderGuardAgentEvent[] {

  if (state.seenFunctionCalls.has(call.id)) {
    return [];
  }
  state.seenFunctionCalls.add(call.id);

  const name = call.name.toLowerCase();

  if (name.includes("quarantine_worker")) {
    const workerId = String(call.args?.worker_id ?? "");
    if (!workerId) {
      return [];
    }

    state.targetWorkerId = workerId;
    state.remediationStarted = true;
    
    return [
      {
        stage: "correlate",
        status: "success",
        message: "Prometheus and Loki evidence correlated",
      },
      {
        stage: "decide",
        status: "success",
        message: `Quarantine ${workerId} recommended`,
      },
      {
        stage: "guard",
        status: "running",
        message: `Evaluating quarantine policy for ${workerId}`,
      },
    ];
  }

  if (name.includes("prometheus")) {
    if (state.verificationComplete) return [];

    const expr = String(call.args?.expr ?? call.args?.query ?? "");
    let message = "Inspecting Prometheus telemetry";

    if (expr.includes("vram_percent")) {
      message = "Inspecting GPU VRAM pressure";
    } else if (expr.includes("active_chunks")) {
      message = state.remediationStarted
        ? "Verifying active render chunks after remediation"
        : "Checking active render chunks";
    } else if (expr.includes("failed_chunks")) {
      message = "Checking failed render chunks";
    } else if (expr.includes("health")) {
      message = "Checking render worker health";
    }

    return [
      {
        stage: state.remediationStarted ? "verify" : "observe",
        status: "running",
        message,
      },
    ];
  }

  if (name.includes("loki") || name.includes("log")) {
    if (state.verificationComplete) return [];

    if (!state.remediationStarted) {
      return [
        {
          stage: "observe",
          status: "success",
          message: "Prometheus telemetry collected",
        },
        {
          stage: "correlate",
          status: "running",
          message: "Searching Loki for correlated failure evidence",
        },
      ];
    }

    return [
      {
        stage: "verify",
        status: "running",
        message: "Verifying remediation through Loki logs",
      },
    ];
  }

  return [];
}

function mapFunctionResponse(
  response: AdkFunctionResponse,
  state: MapperState,
): RenderGuardAgentEvent[] {
  const events: RenderGuardAgentEvent[] = [];
  const name = response.name.toLowerCase();
  const parsedData = parseResponseContent(response);
  const payload = isRecord(parsedData) ? parsedData: {};
  
  const workerId = state.targetWorkerId;
  if (!workerId) {
    return events;
  }

  // 1. QUARANTINE ACTION RESPONSE
  if (name.includes("quarantine_worker")) {
    const allowed = payload.allowed === true;
    state.remediationAllowed = allowed;

    if (!allowed) {
      events.push({
        stage: "guard",
        status: "failed",
        message: typeof payload.reason === "string" ? payload.reason : "Quarantine denied by policy",
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
      message: `Worker ${workerId} removed from active render scheduling`,
    });

    return events;
  }

  // Skip verification parsing if remediation hasn't been authorized yet
  if (!state.remediationStarted || !state.remediationAllowed) {
    return events;
  }

 // 2. PROMETHEUS VERIFICATION RESPONSE
  if (name === "query_prometheus") {
    if (
      hasZeroActiveChunks(
        payload,
        workerId,
      )
    ) {
      state.prometheusVerified = true;

      events.push({
        stage: "verify",
        status: state.lokiVerified ? "success" : "running",
        message: `Prometheus confirms ${workerId} has zero active chunks`,
      });
    }
  }

  // 3. LOKI VERIFICATION RESPONSE
  if (name.includes("loki") || name.includes("log")) {
    if (
      hasQuarantineAuditEvidence(
        parsedData,
        workerId,
      )
    ) {
      state.lokiVerified = true;

      events.push({
        stage: "verify",
        status: state.prometheusVerified
          ? "success"
          : "running",
        message:
          "Loki confirms worker_quarantined audit log event",
      });
    }
  }
  // 4. CLOSED-LOOP COMPLETION TRIGGER
  if (state.prometheusVerified && state.lokiVerified && !state.verificationComplete) {
    state.verificationComplete = true;

    events.push({
      stage: "verify",
      status: "success",
      message: "Prometheus and Loki independently confirm remediation",
    });

    events.push({
      stage: "complete",
      status: "success",
      message: "Remediation independently verified through observability.",
    });
  }

  return events;
}

function hasZeroActiveChunks(
  payload: Record<string, unknown>,
  workerId: string,
): boolean {
  function search(value: unknown): boolean {
    if (typeof value === "string") {
      try {
        return search(JSON.parse(value));
      } catch {
        return false;
      }
    }

    if (Array.isArray(value)) {
      return value.some(search);
    }

    if (!isRecord(value)) {
      return false;
    }

    const metric = isRecord(value.metric) ? value.metric : null;

    if (metric?.__name__ === "renderguard_worker_active_chunks" && metric.worker_id === workerId) {
      // Prometheus instant query
      if (Array.isArray(value.value)) {
        return Number(value.value[1]) === 0;
      }

      // Prometheus range query
      if (Array.isArray(value.values)) {
        const samples = value.values.filter(Array.isArray);

        const latest = samples.at(-1);

        return (Array.isArray(latest) && Number(latest[1]) === 0);
      }
    }

    return Object.values(value).some(search);
  }

  return search(payload);
}

function hasQuarantineAuditEvidence(
  value: unknown,
  workerId: string,
): boolean {
  function search(
    current: unknown,
    key?: string,
  ): boolean {
    /*
     * MCP frequently returns JSON encoded inside
     * content[].text.
     */
    if (typeof current === "string") {
      const text = current.trim();

      /*
       * Do not accidentally verify against an echoed
       * LogQL query such as:
       *
       * {worker_id="render-gpu-03",
       *  event="worker_quarantined"}
       */
      if (
        key === "query" ||
        key === "expr"
      ) {
        return false;
      }

      try {
        return search(JSON.parse(text));
      } catch {
        return (
          text.includes("worker_quarantined") &&
          text.includes(workerId)
        );
      }
    }

    if (Array.isArray(current)) {
      return current.some((item) =>
        search(item),
      );
    }

    if (!isRecord(current)) {
      return false;
    }

    /*
     * Structured Loki labels.
     */
    if (
      current.event === "worker_quarantined" &&
      current.worker_id === workerId
    ) {
      return true;
    }

    /*
     * Loki stream response:
     *
     * {
     *   stream: {
     *     event: "worker_quarantined",
     *     worker_id: "render-gpu-03"
     *   },
     *   values: [...]
     * }
     */
    if (isRecord(current.stream)) {
      const stream = current.stream;

      if (
        stream.event ===
          "worker_quarantined" &&
        stream.worker_id === workerId
      ) {
        const values = current.values;

        /*
         * Require an actual returned log entry.
         * Labels alone are not enough evidence.
         */
        if (
          Array.isArray(values) &&
          values.length > 0
        ) {
          return true;
        }
      }
    }

    /*
     * Common Grafana/MCP shapes:
     * data, result, content, streams, values...
     */
    for (const [childKey, child] of Object.entries(current)) {
      if (
        childKey === "query" ||
        childKey === "expr"
      ) {
        continue;
      }

      if (search(child, childKey)) {
        return true;
      }
    }

    return false;
  }

  return search(value);
}

export function mapAdkResponseToActivity(
  response: AdkFunctionResponse,
  state: MapperState,
): AgentActivity | null {
  if (!response.id) {
    return null;
  }

  const name = response.name.toLowerCase();
  const parsedData = parseResponseContent(response);

  const payload = isRecord(parsedData) ? parsedData: {};

  const isError = payload.isError === true;

  const workerId = state.targetWorkerId;

  if (name === "query_prometheus") {
    if (
      workerId &&
      state.remediationStarted &&
      hasZeroActiveChunks(
        payload,
        workerId,
      )
    ) {
      
      return {
        id: response.id,
        source: "Prometheus",
        status: "success",
        message:
          `${workerId} active chunks confirmed at 0`,
      };
    }

    return {
      id: response.id,
      source: "Prometheus",
      status: "success",
      message:
        "Prometheus telemetry received",
    };
  }

  if (name.includes("loki") || name.includes("log")) {
    if (isError) {
      return {
        id: response.id,
        source: "Loki",
        status: "failed",
        message:
          "Loki query failed; agent will refine the query",
      };
    }

    if (state.remediationStarted && workerId) {
      const verified = hasQuarantineAuditEvidence(parsedData, workerId);

      return {
        id: response.id,
        source: "Loki",
        status: verified ? "success" : "running",
        message: verified ? "Quarantine audit evidence received" : "Waiting for quarantine audit evidence",
      };
    }

    return {
      id: response.id,
      source: "Loki",
      status: "success",
      message: "Failure evidence retrieved",
    };
  }

  if (name === "quarantine_worker") {
    const allowed = payload.allowed === true;

    return {
      id: response.id,
      source: "Policy",
      status: allowed ? "success" : "failed",
      message: allowed ? "Quarantine policy returned ALLOW" : "Quarantine policy returned DENY",
    };
  }

  return null;
}

export function mapAdkCallToActivity(
  call: AdkFunctionCall,
  state: MapperState,
): AgentActivity | null {
  const name = call.name.toLowerCase();

  if (name === "query_prometheus") {
    const expr = String(call.args?.expr ?? call.args?.query ?? "");

    let message = "Querying Prometheus telemetry";

    if (expr.includes("worker_health")) {
      message = "Checking render worker health";
    } else if (expr.includes("vram_percent")) {
      message = "Inspecting GPU VRAM pressure";
    } else if (expr.includes("active_chunks")) {
      message = state.remediationStarted ? "Verifying active chunks after remediation" : "Checking active render chunks";
    }

    return {
      id: call.id,
      source: "Prometheus",
      status: "running",
      message,
    };
  }

  if (name.includes("loki") || name.includes("log")) {
    return {
      id: call.id,
      source: "Loki",
      status: "running",
      message: state.remediationStarted
        ? "Verifying quarantine audit event"
        : "Searching failure evidence",
    };
  }

  if (name === "quarantine_worker") {
    const workerId = String(
      call.args?.worker_id ?? "worker",
    );

    return {
      id: call.id,
      source: "Policy",
      status: "running",
      message: `Evaluating quarantine policy for ${workerId}`,
    };
  }

  return null;
}

export function mapAdkEvent(
  event: AdkEvent,
  state: MapperState,
): RenderGuardAgentEvent[] {
  const mapped: RenderGuardAgentEvent[] = [];

  for (const part of event.content?.parts ?? []) {
    if (part.functionCall) {
      const results = mapFunctionCall(part.functionCall, state);
      mapped.push(...results);
    }

    if (part.functionResponse) {
      const results = mapFunctionResponse(part.functionResponse, state);
      mapped.push(...results);
    }
  }

  return mapped;
}