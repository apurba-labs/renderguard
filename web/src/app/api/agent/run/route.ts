export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_API_URL = process.env.RENDERGUARD_AGENT_URL ?? "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const payload = await request.json();

  const sessionId = payload.sessionId;
  const userId = payload.userId ?? "renderguard-ui";
  const appName = payload.appName ?? "app";

  if (!sessionId) {
    return new Response(
      "sessionId is required",
      { status: 400 },
    );
  }

  const sessionUrl =
    `${AGENT_API_URL}/apps/${appName}/users/${userId}/sessions/${sessionId}`;

  const createSessionResponse = await fetch(
    sessionUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    },
  );

  if (
    !createSessionResponse.ok &&
    createSessionResponse.status !== 409
  ) {
    return new Response(
      await createSessionResponse.text(),
      {
        status: createSessionResponse.status,
      },
    );
  }

  const upstream = await fetch(
    `${AGENT_API_URL}/run_sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    return new Response(
      await upstream.text(),
      {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("Content-Type") ??
            "text/plain",
        },
      },
    );
  }

  if (!upstream.body) {
    return new Response(
      "Agent API returned no response stream",
      { status: 502 },
    );
  }

  return new Response(
    upstream.body,
    {
      status: 200,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ??
          "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    },
  );
}