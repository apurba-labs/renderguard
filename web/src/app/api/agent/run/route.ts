export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_API_URL =
  process.env.RENDERGUARD_AGENT_URL ??
  "http://127.0.0.1:8001";

export async function POST(request: Request) {
  const body = await request.text();

  const upstream = await fetch(
    `${AGENT_API_URL}/run_sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
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