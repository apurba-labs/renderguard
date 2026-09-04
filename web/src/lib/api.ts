import type { RenderWorker } from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_RENDERGUARD_API_URL ??
  "http://127.0.0.1:8000";

export async function getPipelineStatus(
  signal?: AbortSignal,
): Promise<RenderWorker[]> {
  const response = await fetch(
    `${API_URL}/pipeline/status`,
    {
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Pipeline API returned ${response.status}`,
    );
  }

  return response.json();
}