import { mapAdkEvent, createMapperState } from "./mapper";
import { parseSseData } from "./parser";
import type { RenderGuardAgentEvent } from "./types";

const AGENT_API_URL = process.env.NEXT_PUBLIC_RENDERGUARD_AGENT_URL ?? "http://127.0.0.1:8001";

const INVESTIGATION_PROMPT = `
Investigate the current RenderGuard incident using Grafana telemetry.

If the evidence supports remediation, perform the permitted quarantine action.

After the action, independently verify the result through Grafana observability.

Do not claim the incident is resolved unless Prometheus and Loki confirm the expected post-remediation state.
`.trim();

type RunInvestigationOptions = {
  sessionId: string;
  signal?: AbortSignal;
  onEvent: (event: RenderGuardAgentEvent) => void;
};

export async function runInvestigation({
  sessionId,
  signal,
  onEvent,
}: RunInvestigationOptions): Promise<void> {
  const response = await fetch(
    `${AGENT_API_URL}/run_sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        appName: "app",
        userId: "renderguard-ui",
        sessionId,
        newMessage: {
          role: "user",
          parts: [
            {
              text: INVESTIGATION_PROMPT,
            },
          ],
        },
        streaming: true,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Agent API returned ${response.status}`,
    );
  }

  if (!response.body) {
    throw new Error(
      "Agent API returned no response stream",
    );
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader();

  const mapperState = createMapperState();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += value;

    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const adkEvent = parseSseData(block);

      if (!adkEvent) {
        continue;
      }

      for (
        const event of mapAdkEvent(
          adkEvent,
          mapperState,
        )
      ) {
        onEvent(event);
      }
    }
  }
}